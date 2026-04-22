import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';
import { getPendingUsers, approveUser, getAllActiveUsers, updateUserRole, deleteUser } from '../controllers/adminController';

const router = Router();

// Захищаємо всі роути адміністратора
router.use(authenticate, isAdmin);

// Запити на реєстрацію
router.get('/users/pending', getPendingUsers);
router.put('/users/:id/approve', approveUser);

// Активні користувачі
router.get('/users/active', getAllActiveUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;