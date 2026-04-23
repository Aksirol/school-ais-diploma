import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { validationResult } from 'express-validator';
import { Grade, TeacherSubject, Student, User } from '../models';

export const getJournal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacherSubjectId } = req.params;
    const user = req.user!;

    // 1. Перевірка доступу: чи має цей вчитель відношення до цього предмета/класу?
    const assignment = await TeacherSubject.findByPk(teacherSubjectId);
    if (!assignment || (user.role === 'teacher' && assignment.teacher_id !== user.id)) {
      res.status(403).json({ message: 'Доступ до цього журналу заборонено.' });
      return;
    }

    // 2. Отримуємо всіх учнів цього класу та їхні оцінки саме з цього предмета
    const journalData = await Student.findAll({
      where: { class_id: assignment.class_id },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { 
          model: Grade, 
          where: { teacher_subject_id: teacherSubjectId },
          required: false // щоб учні без оцінок теж потрапили в список
        }
      ],
      order: [[User, 'last_name', 'ASC']]
    });

    res.status(200).json(journalData);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка завантаження журналу', error: error.message });
  }
};

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

// В gradeController.ts додаємо:
export const updateGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { value, comment } = req.body;
    const grade = await Grade.findByPk(id);

    if (!grade) return res.status(404).json({ message: 'Оцінку не знайдено' });
    
    // Перевірка: редагувати може лише той вчитель, який поставив (або адмін)
    const assignment = await TeacherSubject.findByPk(grade.teacher_subject_id);
    if (assignment?.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Немає прав для редагування цієї оцінки' });
    }

    await grade.update({ value, comment });
    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення оцінки' });
  }
};

export const deleteGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const grade = await Grade.findByPk(id);
    if (!grade) {
      res.status(404).json({ message: 'Оцінку не знайдено' }); 
      return;
    }
    
    // БЛОК БЕЗПЕКИ: Перевірка прав
    const assignment = await TeacherSubject.findByPk(grade.teacher_subject_id);
    if (assignment?.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Немає прав для видалення цієї оцінки' }); 
      return;
    }

    await grade.destroy();
    res.json({ message: 'Оцінку видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення оцінки' });
  }
};