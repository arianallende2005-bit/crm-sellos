require('dotenv').config();

module.exports = {
    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || 'default-secret-please-change',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Cookie options for JWT
    cookieOptions: {
        httpOnly: true, // Prevents client-side JavaScript access
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    },

    // Bcrypt configuration
    saltRounds: 10,
};
