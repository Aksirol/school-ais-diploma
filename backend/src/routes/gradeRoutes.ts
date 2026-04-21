import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/authMiddleware';
import { addGrade, getGrades, getJournal } from '../controllers/gradeController';

const router = Router();
router.use(authenticate);

router.get('/journal/:teacherSubjectId', getJournal);
router.get('/', getGrades);
router.post('/', [
  body('student_id').isInt(),
  body('teacher_subject_id').isInt(),
  body('grade_date').isDate(),
  body('value').isInt({ min: 1, max: 12 }).withMessage('Оцінка має бути від 1 до 12')
], addGrade);

export default router;