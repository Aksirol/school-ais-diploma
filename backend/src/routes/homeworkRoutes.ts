import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware'; // <-- Імпорт Multer
import { 
  createHomework, deleteHomework, getHomeworks, updateHomework,
  submitHomework, getSubmissions, reviewSubmission // <-- Нові функції
} from '../controllers/homeworkController';

const router = Router();
router.use(authenticate);

// Базовий CRUD для ДЗ
router.get('/', getHomeworks);
router.post('/', createHomework);
router.put('/:id', updateHomework);
router.delete('/:id', deleteHomework);

// --- РОУТИ ЗДАЧІ ТА ПЕРЕВІРКИ ---
// Учень здає роботу (з файлом)
router.post('/:id/submit', upload.single('file'), submitHomework);
// Вчитель отримує список зданих робіт
router.get('/:id/submissions', getSubmissions);
// Вчитель змінює статус роботи (Прийнято/Відхилено)
router.put('/submissions/:subId/review', reviewSubmission);

export default router;