const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Self-service password change (any authenticated user)
router.put('/me/password', verifyToken, userController.changeOwnPassword);

// All routes below require admin privileges
router.use(verifyToken, requireAdmin);

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.put('/:id/password', userController.resetPassword);
router.put('/:id/toggle-active', userController.toggleUserActive);
router.delete('/:id', userController.deleteUser);

module.exports = router;
