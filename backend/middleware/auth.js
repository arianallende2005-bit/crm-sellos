const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

/**
 * Middleware to verify JWT token from cookies
 */
const verifyToken = (req, res, next) => {
    try {
        let token = req.cookies.token;
        
        // Also check Authorization header (Bearer token)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado. Por favor inicie sesión.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado. Por favor inicie sesión nuevamente.'
        });
    }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado.'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }

    next();
};

/**
 * Middleware to require authentication (any role)
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado.'
        });
    }

    next();
};

module.exports = {
    verifyToken,
    requireAdmin,
    requireAuth
};
