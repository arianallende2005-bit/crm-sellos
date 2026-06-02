const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin, requireAdminOrOperator } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(verifyToken);

// Get dashboard stats (admin or operator)
router.get('/stats', requireAdminOrOperator, orderController.getOrderStats);

// Get all orders (filtered by role)
router.get('/', orderController.getAllOrders);

// Get single order
router.get('/:id', orderController.getOrderById);

// Create new order (admin only, with image upload)
router.post('/', requireAdmin, upload.single('image'), handleUploadError, orderController.createOrder);

// Update order status (admin or operator, with optional image upload)
router.put('/:id/status', requireAdminOrOperator, upload.single('image'), handleUploadError, orderController.updateOrderStatus);

// Update order priority (admin only)
router.put('/:id/priority', requireAdmin, orderController.updateOrderPriority);

// Toggle archive status (admin or operator)
router.put('/:id/archive', requireAdminOrOperator, orderController.toggleArchiveStatus);

// Update order details (admin only, with optional image upload)
router.put('/:id', requireAdmin, upload.single('image'), handleUploadError, orderController.updateOrder);

// Update order history notes (admin or operator)
router.put('/history/:historyId/notes', requireAdminOrOperator, orderController.updateHistoryNotes);

// Update or create order history notes by order ID and status (admin or operator)
router.put('/:orderId/history/:status/notes', requireAdminOrOperator, orderController.updateOrCreateHistoryNotes);

// Delete order (admin only)
router.delete('/:id', requireAdmin, orderController.deleteOrder);

module.exports = router;
