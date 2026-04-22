import { Request, Response } from 'express';
import { Class, Subject } from '../models';
import { AuthRequest } from '../middlewares/authMiddleware';

// --- КЛАСИ ---

export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, year } = req.body;
    
    // Перевірка, чи існує такий клас у цьому році
    const existingClass = await Class.findOne({ where: { name, year } });
    if (existingClass) {
      res.status(400).json({ message: 'Такий клас вже існує для цього навчального року.' });
      return;
    }

    const newClass = await Class.create({ name, year });
    res.status(201).json(newClass);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка створення класу' });
  }
};

export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    // Всі користувачі можуть бачити класи (це потрібно для форми реєстрації учня)
    const classes = await Class.findAll({ order: [['year', 'DESC'], ['name', 'ASC']] });
    res.status(200).json(classes);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання списку класів' });
  }
};

// --- ДЛЯ КЛАСІВ ---
export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, year } = req.body;
    const cls = await Class.findByPk(id);
    if (!cls) { res.status(404).json({ message: 'Клас не знайдено' }); return; }
    
    await cls.update({ name, year });
    res.json(cls);
  } catch (error: any) { res.status(500).json({ message: 'Помилка', error: error.message }); }
};

export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cls = await Class.findByPk(id);
    if (!cls) { res.status(404).json({ message: 'Клас не знайдено' }); return; }
    
    await cls.destroy();
    res.json({ message: 'Клас видалено' });
  } catch (error: any) { res.status(500).json({ message: 'Помилка (можливо, є пов\'язані дані)', error: error.message }); }
};

// --- ПРЕДМЕТИ ---

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    
    const existingSubject = await Subject.findOne({ where: { name } });
    if (existingSubject) {
      res.status(400).json({ message: 'Такий предмет вже існує.' });
      return;
    }

    const newSubject = await Subject.create({ name });
    res.status(201).json(newSubject);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка створення предмета' });
  }
};

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання списку предметів' });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ message: 'Предмет не знайдено' });
    await subject.update({ name });
    res.json(subject);
  } catch (error: any) { res.status(500).json({ message: 'Помилка оновлення' }); }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ message: 'Предмет не знайдено' });
    await subject.destroy();
    res.json({ message: 'Предмет видалено' });
  } catch (error: any) { res.status(500).json({ message: 'Помилка (можливо, є активні призначення)' }); }
};