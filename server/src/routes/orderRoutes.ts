import { Router } from 'express';
import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get all orders (Admin sees all filtered, Client sees own)
router.get('/', getOrders);

// Get single order
router.get('/:id', getOrderById);

// Admin only routes
router.post('/', authorize(['admin']), createOrder);
router.patch('/:id/status', authorize(['admin']), updateOrderStatus);

export default router;
