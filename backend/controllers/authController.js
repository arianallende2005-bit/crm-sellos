const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { jwtSecret, jwtExpiresIn, cookieOptions } = require('../config/auth');

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos.'
            });
        }

        // Find user by username
        const result = await pool.query(
            'SELECT id, username, password, email, full_name, role, is_active FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos.'
            });
        }

        const user = result.rows[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta desactivada. Contacte al administrador.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            jwtSecret,
            { expiresIn: jwtExpiresIn }
        );

        // Set token as httpOnly cookie
        res.cookie('token', token, cookieOptions);

        // Return user info (without password)
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            token, // Send token in response for localStorage
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor. Intente nuevamente.'
        });
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente.'
    });
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor.'
        });
    }
};

module.exports = {
    login,
    logout,
    getCurrentUser
};
