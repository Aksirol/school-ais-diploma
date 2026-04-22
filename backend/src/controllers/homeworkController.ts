import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Homework, TeacherSubject, Subject, Class, Student } from '../models';

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