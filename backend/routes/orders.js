const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(verifyToken);

// Get dashboard stats (admin only)
router.get('/stats', requireAdmin, orderController.getOrderStats);

// Get all orders (filtered by role)
router.get('/', orderController.getAllOrders);

// Get single order
router.get('/:id', orderController.getOrderById);

// Create new order (admin only, with image upload)
router.post('/', requireAdmin, upload.single('image'), handleUploadError, orderController.createOrder);

// Update order status (admin only)
router.put('/:id/status', requireAdmin, orderController.updateOrderStatus);

// Update order priority (admin only)
router.put('/:id/priority', requireAdmin, orderController.updateOrderPriority);

// Toggle archive status (admin only)
router.put('/:id/archive', requireAdmin, orderController.toggleArchiveStatus);

// Update order details (admin only, with optional image upload)
router.put('/:id', requireAdmin, upload.single('image'), handleUploadError, orderController.updateOrder);

// Delete order (admin only)
router.delete('/:id', requireAdmin, orderController.deleteOrder);

module.exports = router;
