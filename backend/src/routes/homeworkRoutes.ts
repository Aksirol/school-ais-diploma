import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { createHomework, deleteHomework, getHomeworks, updateHomework } from '../controllers/homeworkController';

const router = Router();
router.use(authenticate);

router.get('/', getHomeworks);
router.post('/', createHomework);
router.put('/:id', updateHomework);
router.delete('/:id', deleteHomework);

export default router;