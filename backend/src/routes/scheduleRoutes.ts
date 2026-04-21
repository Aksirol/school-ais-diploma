import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { getScheduleByClass } from '../controllers/scheduleController';

const router = Router();
router.use(authenticate);

router.get('/:className', getScheduleByClass);

export default router;