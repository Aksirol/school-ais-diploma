import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';
import { assignTeacher, getAssignments } from '../controllers/assignmentController';

const router = Router();

// Валідація для POST запиту
const assignmentValidation = [
  body('teacher_id').isInt().withMessage('ID вчителя має бути цілим числом'),
  body('subject_id').isInt().withMessage('ID предмета має бути цілим числом'),
  body('class_id').isInt().withMessage('ID класу має бути цілим числом'),
];

// Всі роути потребують авторизації
router.use(authenticate);

// GET /api/assignments (Адмін бачить усі, педагог - лише свої)
router.get('/', getAssignments);

// POST /api/assignments (Тільки Адміністратор)
router.post('/', isAdmin, assignmentValidation, assignTeacher);

export default router;