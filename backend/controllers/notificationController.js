const pool = require('../config/database');

/**
 * Get user notifications with unread count
 * GET /api/notifications
 */
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;

        // Get notifications
        const notifications = await pool.query(
            `SELECT n.*, o.product_name, o.current_status 
       FROM notifications n
       LEFT JOIN orders o ON n.order_id = o.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2`,
            [userId, limit]
        );

        // Get unread count
        const unreadCount = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({
            success: true,
            notifications: notifications.rows,
            unreadCount: parseInt(unreadCount.rows[0].count)
        });

    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener notificaciones.'
        });
    }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada.'
            });
        }

        res.json({
            success: true,
            message: 'Notificación marcada como leída.',
            notification: result.rows[0]
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar notificación.'
        });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas.'
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar notificaciones.'
        });
    }
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllAsRead
};
