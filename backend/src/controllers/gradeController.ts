import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { validationResult } from 'express-validator';
import { Grade, TeacherSubject, Student, User } from '../models';

export const addGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { student_id, teacher_subject_id, grade_date, value, comment } = req.body;
    const user = req.user!;

    // Безпека: Педагог може ставити оцінки лише у своїх класах
    if (user.role === 'teacher') {
      const assignment = await TeacherSubject.findOne({
        where: { id: teacher_subject_id, teacher_id: user.id }
      });
      if (!assignment) {
        res.status(403).json({ message: 'Ви не маєте доступу до цього журналу.' });
        return;
      }
    }

    const grade = await Grade.create({ student_id, teacher_subject_id, grade_date, value, comment });
    res.status(201).json({ message: 'Оцінку успішно виставлено', grade });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка збереження оцінки' });
  }
};

export const getGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const requestedStudentId = req.query.student_id ? parseInt(req.query.student_id as string) : null;

    let targetStudentId = requestedStudentId;

    // ПЕРЕВІРКА ДОСТУПУ НА РІВНІ ОБ'ЄКТА (Найважливіша частина для диплому)
    if (user.role === 'student') {
      const currentStudent = await Student.findOne({ where: { user_id: user.id } });
      
      if (!currentStudent) {
        res.status(404).json({ message: 'Профіль учня не знайдено' });
        return;
      }

      // Якщо учень намагається запитати чужі оцінки (передав чужий ID у запиті)
      if (requestedStudentId && requestedStudentId !== currentStudent.id) {
        res.status(403).json({ message: 'Forbidden. Ви можете переглядати лише власні оцінки.' });
        return;
      }
      
      // Примусово обмежуємо пошук лише його власним ID
      targetStudentId = currentStudent.id;
    }

    const whereClause: any = {};
    if (targetStudentId) {
      whereClause.student_id = targetStudentId;
    }

    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        { 
          model: Student, 
          include: [{ model: User, attributes: ['first_name', 'last_name'] }] 
        },
        { model: TeacherSubject } // Для отримання назви предмета
      ],
      order: [['grade_date', 'DESC']]
    });

    res.status(200).json(grades);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання оцінок' });
  }
};