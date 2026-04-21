const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { saltRounds } = require('../config/auth');

/**
 * Get all users (clients only, admin excluded)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, full_name, role, is_active, created_at 
       FROM users 
       WHERE role = 'cliente' 
       ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users: result.rows
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios.'
        });
    }
};

/**
 * Create new user (client)
 * POST /api/users
 */
const createUser = async (req, res) => {
    try {
        const { username, password, email, full_name } = req.body;

        // Validate input
        if (!username || !email || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos.'
            });
        }

        // Generate password if not provided
        const userPassword = password || generateRandomPassword();

        // Check if username or email already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El usuario o email ya existe.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (username, password, email, full_name, role) 
       VALUES ($1, $2, $3, $4, 'cliente') 
       RETURNING id, username, email, full_name, role, is_active, created_at`,
            [username, hashedPassword, email, full_name]
        );

        const newUser = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.',
            user: newUser,
            temporaryPassword: !password ? userPassword : undefined // Only send if auto-generated
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario.'
        });
    }
};

/**
 * Update user information
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name } = req.body;

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [id, 'cliente']);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        // Update user
        const result = await pool.query(
            `UPDATE users 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           full_name = COALESCE($3, full_name)
       WHERE id = $4 
       RETURNING id, username, email, full_name, role, is_active, created_at`,
            [username, email, full_name, id]
        );

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente.',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario.'
        });
    }
};

/**
 * Reset user password
 * PUT /api/users/:id/password
 */
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Generate new password if not provided
        const newPassword = password || generateRandomPassword();

        // Hash password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password - works for any user including admin
        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
            [hashedPassword, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente.',
            temporaryPassword: !password ? newPassword : undefined
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al restablecer contraseña.'
        });
    }
};

/**
 * Change own password (self-service for logged-in user)
 * PUT /api/users/me/password
 */
const changeOwnPassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Se requiere la contraseña actual y la nueva.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        // Get current hashed password
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        res.json({ success: true, message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        console.error('Change own password error:', error);
        res.status(500).json({ success: false, message: 'Error al cambiar contraseña.' });
    }
};

/**
 * Toggle user active status
 * PUT /api/users/:id/toggle-active
 */
const toggleUserActive = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE users 
       SET is_active = NOT is_active 
       WHERE id = $1 AND role = $2
       RETURNING id, username, is_active`,
            [id, 'cliente']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        res.json({
            success: true,
            message: `Usuario ${result.rows[0].is_active ? 'activado' : 'desactivado'} exitosamente.`,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Toggle user active error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del usuario.'
        });
    }
};

/**
 * Helper function to generate random password
 */
function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    resetPassword,
    changeOwnPassword,
    toggleUserActive
};
