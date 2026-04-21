import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { createHomework, getHomeworks } from '../controllers/homeworkController';

const router = Router();
router.use(authenticate);

router.get('/', getHomeworks);
router.post('/', createHomework);

export default router;