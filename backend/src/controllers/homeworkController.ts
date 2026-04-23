import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Homework, TeacherSubject, Subject, Class, Student, User, HomeworkSubmission } from '../models';

export const createHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, due_date, teacher_subject_id } = req.body;
    const user = req.user!;

    // Перевірка доступу (тільки призначений вчитель може задати ДЗ)
    const assignment = await TeacherSubject.findOne({ where: { id: teacher_subject_id, teacher_id: user.id } });
    if (!assignment && user.role !== 'admin') {
      res.status(403).json({ message: 'Ви не можете додавати завдання для цього класу.' });
      return;
    }

    const homework = await Homework.create({ title, description, due_date, teacher_subject_id });
    res.status(201).json(homework);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка створення ДЗ', error: error.message });
  }
};

export const getHomeworks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let allowedTeacherSubjectIds: number[] = [];

    if (user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: user.id } });
      if (student) {
        const assignments = await TeacherSubject.findAll({ where: { class_id: student.class_id } });
        allowedTeacherSubjectIds = assignments.map(a => a.id);
      }
    } else if (user.role === 'teacher') {
      const assignments = await TeacherSubject.findAll({ where: { teacher_id: user.id } });
      allowedTeacherSubjectIds = assignments.map(a => a.id);
    }

    const whereClause = user.role === 'admin' ? {} : { teacher_subject_id: allowedTeacherSubjectIds };

    const homeworks = await Homework.findAll({
      where: whereClause,
      include: [
        { 
          model: TeacherSubject, 
          include: [{ model: Subject, attributes: ['name'] }, { model: Class, attributes: ['name'] }] 
        }
      ],
      order: [['due_date', 'ASC']] // Найближчі дедлайни зверху
    });

    res.status(200).json(homeworks);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання ДЗ', error: error.message });
  }
};

// Оновлення ДЗ
export const updateHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, due_date } = req.body;
    
    const homework = await Homework.findByPk(id);
    if (!homework) {
      res.status(404).json({ message: 'Завдання не знайдено' });
      return;
    }

    // Перевірка прав (вчитель може редагувати тільки свої)
    const assignment = await TeacherSubject.findByPk(homework.teacher_subject_id);
    if (assignment?.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Доступ заборонено' });
      return;
    }

    await homework.update({ title, description, due_date });
    res.json(homework);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка оновлення ДЗ', error: error.message });
  }
};

// Видалення ДЗ
export const deleteHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework) {
      res.status(404).json({ message: 'Завдання не знайдено' });
      return;
    }

    const assignment = await TeacherSubject.findByPk(homework.teacher_subject_id);
    if (assignment?.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Доступ заборонено' });
      return;
    }

    await homework.destroy();
    res.json({ message: 'Завдання видалено' });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка видалення ДЗ', error: error.message });
  }
};

// --- ЗДАЧА ТА ПЕРЕВІРКА ДОМАШНІХ ЗАВДАНЬ ---

// 1. Учень здає роботу
export const submitHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homework_id = req.params.id;
    const { student_comment } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    const user = req.user!;

    const homework = await Homework.findByPk(homework_id);
    if (!homework) { res.status(404).json({ message: 'Завдання не знайдено' }); return; }
    
    // Якщо поточна дата (на початку дня) більша за due_date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(homework.due_date);
    
    if (today > dueDate) {
      res.status(400).json({ message: 'Термін здачі цього завдання вже минув' });
      return;
    }

    if (user.role !== 'student') {
      res.status(403).json({ message: 'Тільки учні можуть здавати роботи' }); return;
    }

    const student = await Student.findOne({ where: { user_id: user.id } });
    if (!student) {
      res.status(404).json({ message: 'Профіль учня не знайдено' }); return;
    }

    // Перевіряємо, чи не здавав він її вже (опціонально можна дозволити перезалив файлу)
    let submission = await HomeworkSubmission.findOne({ where: { homework_id, student_id: student.id } });
    
    if (submission) {
      // Якщо вже є, оновлюємо
      await submission.update({ file_url: file_url || submission.file_url, student_comment, status: 'submitted' });
    } else {
      // Якщо немає, створюємо нову
      submission = await HomeworkSubmission.create({ homework_id: Number(homework_id), student_id: student.id, file_url, student_comment });
    }

    res.status(201).json({ message: 'Роботу надіслано!', submission });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка відправки роботи', error: error.message });
  }
};

// 2. Вчитель отримує список робіт для конкретного ДЗ
export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homework_id = req.params.id;
    
    // БЛОК БЕЗПЕКИ
    const homework = await Homework.findByPk(homework_id);
    if (!homework) { res.status(404).json({ message: 'ДЗ не знайдено' }); return; }

    const assignment = await TeacherSubject.findByPk(homework.teacher_subject_id);
    if (assignment?.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Тільки автор завдання може переглядати роботи' }); 
      return;
    }

    const submissions = await HomeworkSubmission.findAll({
      where: { homework_id },
      include: [
        { model: Student, include: [{ model: User, attributes: ['first_name', 'last_name', 'middle_name'] }] }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка завантаження робіт' });
  }
};

// 3. Вчитель оцінює/перевіряє роботу
export const reviewSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subId } = req.params;
    const { status, teacher_comment } = req.body; 

    const submission = await HomeworkSubmission.findByPk(subId);
    if (!submission) { res.status(404).json({ message: 'Роботу не знайдено' }); return; }

    // БЛОК БЕЗПЕКИ
    const homework = await Homework.findByPk(submission.homework_id);
    const assignment = await TeacherSubject.findByPk(homework?.teacher_subject_id);
    
    if (assignment?.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Тільки автор завдання може перевіряти ці роботи' }); 
      return;
    }

    await submission.update({ status, teacher_comment });
    res.json({ message: 'Статус роботи оновлено', submission });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка перевірки роботи' });
  }
};