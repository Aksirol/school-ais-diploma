import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware'; // <-- Додаємо імпорт
import { getScheduleByClass, upsertSchedule } from '../controllers/scheduleController';

const router = Router();

// Читати можуть всі авторизовані
router.get('/:className', authenticate, getScheduleByClass);

// ЗМІНЮВАТИ може тільки адміністратор!
router.post('/', authenticate, isAdmin, upsertSchedule); 
// (Або router.put('/', ... якщо ви використовували PUT)

export default router;