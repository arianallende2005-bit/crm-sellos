const pool = require('../config/database');
const path = require('path');
const { compressImage, deleteImage } = require('../utils/imageProcessor');

/**
 * Get all orders (filtered by role)
 * GET /api/orders
 */
const getAllOrders = async (req, res) => {
    try {
        const { status, client_id, search, show_archived } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
      SELECT o.*, u.full_name as client_name, u.username as client_username
      FROM orders o
      JOIN users u ON o.client_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        // Filter by role: clients see only their orders
        if (userRole === 'cliente') {
            query += ` AND o.client_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        } else if (client_id) {
            // Admin can filter by client
            query += ` AND o.client_id = $${paramIndex}`;
            params.push(client_id);
            paramIndex++;
        }

        // Filter by status
        if (status) {
            query += ` AND o.current_status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Filter by archived status
        if (show_archived === 'true') {
            query += ` AND o.is_archived = true`;
        } else if (show_archived === 'all') {
            // Do not filter by is_archived, return both active and archived
        } else {
            // Default to active only if not specified or explicit 'false'
            query += ` AND o.is_archived = false`;
        }

        // Search by product name or order ID or client_name or username
        if (search) {
            query += ` AND (o.product_name ILIKE $${paramIndex} OR CAST(o.id AS TEXT) LIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY o.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            orders: result.rows
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos.'
        });
    }
};

/**
 * Get single order with full history
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get order details
        let orderQuery = `
      SELECT o.*, u.full_name as client_name, u.email as client_email, u.username as client_username
      FROM orders o
      JOIN users u ON o.client_id = u.id
      WHERE o.id = $1
    `;

        // Clients can only see their own orders
        if (userRole === 'cliente') {
            orderQuery += ` AND o.client_id = $2`;
        }

        const params = userRole === 'cliente' ? [id, userId] : [id];
        const orderResult = await pool.query(orderQuery, params);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado o no tiene acceso.'
            });
        }

        const order = orderResult.rows[0];

        // Get order history
        const historyResult = await pool.query(
            `SELECT oh.*, u.username as changed_by_username, u.full_name as changed_by_name
       FROM order_history oh
       LEFT JOIN users u ON oh.changed_by = u.id
       WHERE oh.order_id = $1
       ORDER BY oh.changed_at ASC`,
            [id]
        );

        order.history = historyResult.rows;

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedido.'
        });
    }
};

/**
 * Create new order
 * POST /api/orders
 */
const createOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        const { client_id, product_name } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!client_id || !product_name) {
            return res.status(400).json({
                success: false,
                message: 'Cliente y nombre del producto son requeridos.'
            });
        }

        // Check if client exists
        const clientCheck = await client.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [client_id, 'cliente']
        );

        if (clientCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado.'
            });
        }

        let imagePath = null;

        // Process uploaded image if present
        if (req.file) {
            imagePath = await compressImage(req.file.path);
            // Store relative path and normalize backslashes for URL compatibility
            imagePath = path.relative(process.cwd(), imagePath).replace(/\\/g, '/');
        }

        // Start transaction
        await client.query('BEGIN');

        // Insert order
        const orderResult = await client.query(
            `INSERT INTO orders (client_id, product_name, image_url, current_status)
       VALUES ($1, $2, $3, 'diseno_realizado')
       RETURNING *`,
            [client_id, product_name, imagePath]
        );

        const newOrder = orderResult.rows[0];

        // Insert initial history record
        await client.query(
            `INSERT INTO order_history (order_id, status, changed_by)
       VALUES ($1, 'diseno_realizado', $2)`,
            [newOrder.id, userId]
        );

        // Create notification for client
        await client.query(
            `INSERT INTO notifications (user_id, order_id, message)
       VALUES ($1, $2, $3)`,
            [
                client_id,
                newOrder.id,
                `Nuevo pedido creado: ${product_name}`
            ]
        );

        // Commit transaction
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente.',
            order: newOrder
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create order error:', error);

        // Delete uploaded file if error occurs
        if (req.file) {
            deleteImage(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear pedido.'
        });
    } finally {
        client.release();
    }
};

/**
 * Update order status
 * PUT /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { status, notes, nro_remito } = req.body;
        const userId = req.user.id;

        const validStatuses = [
            'diseno_realizado',
            'procesado_fotopolimero',
            'montaje',
            'correcion',
            'listo_entrega'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido.'
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Update order status
        let queryParams = [status, id];
        let setQuery = 'SET current_status = $1, updated_at = CURRENT_TIMESTAMP';
        if (nro_remito !== undefined && nro_remito !== '') {
            setQuery += ', nro_remito = $3';
            queryParams.push(nro_remito);
        }

        const orderResult = await client.query(
            `UPDATE orders 
       ${setQuery}
       WHERE id = $2
       RETURNING *`,
            queryParams
        );

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado.'
            });
        }

        const updatedOrder = orderResult.rows[0];

        // Insert history record
        await client.query(
            `INSERT INTO order_history (order_id, status, changed_by, notes)
       VALUES ($1, $2, $3, $4)`,
            [id, status, userId, notes || null]
        );

        // Create notification for client
        const statusMessages = {
            'diseno_realizado': 'Diseño realizado',
            'procesado_fotopolimero': 'Procesado de fotopolímero',
            'montaje': 'Montaje',
            'correcion': 'Corrección',
            'listo_entrega': 'Listo para entrega'
        };

        await client.query(
            `INSERT INTO notifications (user_id, order_id, message)
       VALUES ($1, $2, $3)`,
            [
                updatedOrder.client_id,
                id,
                `Estado actualizado: ${statusMessages[status]} - ${updatedOrder.product_name}`
            ]
        );

        // Commit transaction
        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Estado actualizado exitosamente.',
            order: updatedOrder
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado del pedido.'
        });
    } finally {
        client.release();
    }
};

/**
 * Update order details
 * PUT /api/orders/:id
 */
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, nro_remito } = req.body;

        let imagePath = null;

        // Process new image if uploaded
        if (req.file) {
            // Get old image path to delete it
            const oldOrderResult = await pool.query('SELECT image_url FROM orders WHERE id = $1', [id]);
            if (oldOrderResult.rows.length > 0 && oldOrderResult.rows[0].image_url) {
                deleteImage(oldOrderResult.rows[0].image_url);
            }

            imagePath = await compressImage(req.file.path);
            imagePath = path.relative(process.cwd(), imagePath).replace(/\\/g, '/');
        }

        // Update order
        const updateFields = [];
        const params = [];
        let paramIndex = 1;

        if (product_name) {
            updateFields.push(`product_name = $${paramIndex}`);
            params.push(product_name);
            paramIndex++;
        }

        if (imagePath) {
            updateFields.push(`image_url = $${paramIndex}`);
            params.push(imagePath);
            paramIndex++;
        }

        if (nro_remito !== undefined) {
            updateFields.push(`nro_remito = $${paramIndex}`);
            params.push(nro_remito);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar.'
            });
        }

        params.push(id);
        const query = `UPDATE orders SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado.'
            });
        }

        res.json({
            success: true,
            message: 'Pedido actualizado exitosamente.',
            order: result.rows[0]
        });

    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar pedido.'
        });
    }
};

/**
 * Get dashboard statistics (admin only)
 * GET /api/orders/stats
 */
const getOrderStats = async (req, res) => {
    try {
        // Count by status
        const statusCounts = await pool.query(`
      SELECT current_status, COUNT(*) as count
      FROM orders
      WHERE is_archived = false
      GROUP BY current_status
    `);

        // Total active orders
        const totalActive = await pool.query(`
      SELECT COUNT(*) as count FROM orders WHERE is_archived = false
    `);

        // Total clients
        const totalClients = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'cliente' AND is_active = true
    `);

        // Recent orders
        const recentOrders = await pool.query(`
      SELECT o.*, u.full_name as client_name
      FROM orders o
      JOIN users u ON o.client_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

        res.json({
            success: true,
            stats: {
                byStatus: statusCounts.rows,
                totalActive: parseInt(totalActive.rows[0].count),
                totalClients: parseInt(totalClients.rows[0].count),
                recentOrders: recentOrders.rows
            }
        });

    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas.'
        });
    }
};

/**
 * Delete order
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Get order to check for image
        const orderResult = await pool.query('SELECT image_url FROM orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado.'
            });
        }

        const imagePath = orderResult.rows[0].image_url;

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Delete order (Cascade handles history and notifications)
            await client.query('DELETE FROM orders WHERE id = $1', [id]);

            await client.query('COMMIT');

            // Delete image file if exists
            if (imagePath) {
                // imagePath is relative to project root (e.g., 'uploads/...')
                const absolutePath = path.join(process.cwd(), imagePath);
                deleteImage(absolutePath);
            }

            res.json({
                success: true,
                message: 'Pedido eliminado exitosamente.'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar pedido.'
        });
    }
};

/**
 * Toggle archive status
 * PUT /api/orders/:id/archive
 */
const toggleArchiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_archived } = req.body;

        const result = await pool.query(
            'UPDATE orders SET is_archived = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [is_archived, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado.'
            });
        }

        res.json({
            success: true,
            message: 'Estado de archivo actualizado exitosamente.',
            order: result.rows[0]
        });

    } catch (error) {
        console.error('Toggle archive error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de archivo.'
        });
    }
}

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    updateOrder,
    getOrderStats,
    deleteOrder,
    toggleArchiveStatus
};
