import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';
import { getPendingUsers, approveUser, rejectUser } from '../controllers/adminController';

const router = Router();

// Застосовуємо обидва мідлвари до всіх роутів у цьому файлі
router.use(authenticate, isAdmin);

// GET /api/admin/users/pending
router.get('/users/pending', getPendingUsers);

// PUT /api/admin/users/:id/approve
router.put('/users/:id/approve', approveUser);

// DELETE /api/admin/users/:id/reject
router.delete('/users/:id/reject', rejectUser);

export default router;