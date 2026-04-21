import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { validationResult } from 'express-validator';
import { Material, TeacherSubject, Student } from '../models';

export const uploadMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { teacher_subject_id, title, type, url } = req.body;
    const user = req.user!;

    // 1. Перевірка: чи має цей педагог право додавати матеріал сюди?
    const assignment = await TeacherSubject.findOne({
      where: { id: teacher_subject_id, teacher_id: user.id }
    });

    if (!assignment && user.role !== 'admin') {
      res.status(403).json({ message: 'Ви не можете додавати матеріали до чужого класу/предмета.' });
      return;
    }

    // 2. Обробка файлу або посилання
    let finalUrl = url; // Якщо тип 'link', беремо URL з тіла запиту

    if (type !== 'link') {
      if (!req.file) {
        res.status(400).json({ message: 'Файл не завантажено.' });
        return;
      }
      // Зберігаємо відносний шлях для доступу через статику
      finalUrl = `/uploads/${req.file.filename}`; 
    }

    const material = await Material.create({
      teacher_subject_id,
      title,
      type,
      url: finalUrl
    });

    res.status(201).json({ message: 'Матеріал успішно додано', material });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка завантаження матеріалу', error: error.message });
  }
};

export const getMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { class_id, subject_id } = req.query; // Фільтри з фронтенду

    let allowedTeacherSubjectIds: number[] = [];

    // РОЗМЕЖУВАННЯ ПРАВ НА РІВНІ ОБ'ЄКТА
    if (user.role === 'student') {
      // Учень бачить лише матеріали свого класу
      const student = await Student.findOne({ where: { user_id: user.id } });
      if (!student) {
        res.status(404).json({ message: 'Профіль учня не знайдено' });
        return;
      }
      
      const assignments = await TeacherSubject.findAll({ where: { class_id: student.class_id } });
      allowedTeacherSubjectIds = assignments.map(a => a.id);
    } else if (user.role === 'teacher') {
      // Педагог бачить лише матеріали своїх призначень
      const assignments = await TeacherSubject.findAll({ where: { teacher_id: user.id } });
      allowedTeacherSubjectIds = assignments.map(a => a.id);
    }

    // Якщо це учень/педагог і список їхніх призначень порожній
    if (user.role !== 'admin' && allowedTeacherSubjectIds.length === 0) {
      res.status(200).json([]);
      return;
    }

    // Формуємо умови пошуку
    const whereClause: any = {};
    if (user.role !== 'admin') {
      whereClause.teacher_subject_id = allowedTeacherSubjectIds;
    }

    // Фільтрація (якщо передані query параметри з фронтенду)
    if (class_id || subject_id) {
      const tsWhere: any = {};
      if (class_id) tsWhere.class_id = class_id;
      if (subject_id) tsWhere.subject_id = subject_id;
      
      const filtered = await TeacherSubject.findAll({ where: tsWhere });
      const filteredIds = filtered.map(a => a.id);
      
      // Перетинаємо масиви: залишаємо лише ті ID, які і дозволені користувачу, і відповідають фільтрам
      if (user.role !== 'admin') {
        whereClause.teacher_subject_id = allowedTeacherSubjectIds.filter(id => filteredIds.includes(id));
      } else {
        whereClause.teacher_subject_id = filteredIds;
      }
    }

    const materials = await Material.findAll({
      where: whereClause,
      order: [['uploaded_at', 'DESC']]
    });

    res.status(200).json(materials);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання матеріалів' });
  }
};