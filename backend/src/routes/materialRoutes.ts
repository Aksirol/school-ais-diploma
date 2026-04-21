import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/authMiddleware';
import { uploadMaterial, getMaterials } from '../controllers/materialController';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();
router.use(authenticate);

router.get('/', getMaterials);

// Використовуємо multer (.single('file')) ДО валідації полів
router.post('/', 
  upload.single('file'),
  [
    body('teacher_subject_id').isInt().withMessage('ID призначення обов\'язкове'),
    body('title').notEmpty().trim().escape().withMessage('Назва обов\'язкова'),
    body('type').isIn(['pdf', 'ppt', 'doc', 'video', 'link']).withMessage('Невірний тип матеріалу')
  ], 
  uploadMaterial
);

export default router;