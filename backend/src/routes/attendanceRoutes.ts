import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { saveAttendance, getAttendance } from '../controllers/attendanceController';

const router = Router();
router.use(authenticate);

router.post('/', saveAttendance);
router.get('/', getAttendance);

export default router;