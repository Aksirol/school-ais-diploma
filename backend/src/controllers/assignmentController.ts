import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TeacherSubject, User, Subject, Class } from '../models';

// Призначити педагога на предмет у класі
export const assignTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacher_id, subject_id, class_id } = req.body;

    // 1. Перевірка: чи існує такий користувач і чи він є педагогом?
    const teacher = await User.findOne({ where: { id: teacher_id, role: 'teacher' } });
    if (!teacher) {
      res.status(404).json({ message: 'Педагога не знайдено або вказаний користувач не має відповідної ролі.' });
      return;
    }

    // 2. Перевірка: чи існують предмет і клас?
    const targetClass = await Class.findByPk(class_id);
    const targetSubject = await Subject.findByPk(subject_id);
    
    if (!targetClass || !targetSubject) {
      res.status(404).json({ message: 'Клас або предмет не знайдено в базі даних.' });
      return;
    }

    // 3. Перевірка на дублікат (унікальний композитний індекс)
    const existingAssignment = await TeacherSubject.findOne({
      where: { teacher_id, subject_id, class_id }
    });
    
    if (existingAssignment) {
      res.status(400).json({ message: 'Цей педагог вже призначений на цей предмет у даному класі.' });
      return;
    }

    // 4. Створення прив'язки
    const newAssignment = await TeacherSubject.create({ teacher_id, subject_id, class_id });
    res.status(201).json({ message: 'Педагога успішно призначено', assignment: newAssignment });

  } catch (error: any) {
    res.status(500).json({ message: 'Помилка призначення', error: error.message });
  }
};

// Отримати всі призначення (для адміна) або призначення конкретного педагога (для нього самого)
export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Тепер TypeScript знає, що req.user існує
    const user = req.user!; 
    
    const whereClause = user.role === 'admin' ? {} : { teacher_id: user.id };

    const assignments = await TeacherSubject.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Subject, attributes: ['id', 'name'] },
        { model: Class, attributes: ['id', 'name', 'year'] }
      ]
    });

    res.status(200).json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання списку призначень', error: error.message });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await TeacherSubject.findByPk(id);
    if (!assignment) return res.status(404).json({ message: 'Призначення не знайдено' });
    await assignment.destroy();
    res.json({ message: 'Призначення скасовано' });
  } catch (error: any) { res.status(500).json({ message: 'Помилка видалення' }); }
};