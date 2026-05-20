import { Router } from 'express';
import { getClients, createClient, updateClient, toggleClientStatus, resetPassword } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['admin']));

router.get('/clients', getClients);
router.post('/clients', createClient);
router.put('/clients/:id', updateClient);
router.patch('/clients/:id/status', toggleClientStatus);
router.post('/clients/:id/reset-password', resetPassword);

export default router;
