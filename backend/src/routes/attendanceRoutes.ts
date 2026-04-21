import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { saveAttendance } from '../controllers/attendanceController';

const router = Router();
router.use(authenticate);

router.post('/', saveAttendance);

export default router;