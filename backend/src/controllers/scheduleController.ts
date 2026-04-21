import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Schedule, TeacherSubject, Subject, User, Class } from '../models';

export const getScheduleByClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { className } = req.params; // Отримуємо назву класу (напр. "5-А")

    // Знаходимо клас за назвою
    const targetClass = await Class.findOne({ where: { name: className } });
    if (!targetClass) {
      res.status(404).json({ message: 'Клас не знайдено' });
      return;
    }

    const schedule = await Schedule.findAll({
      include: [
        {
          model: TeacherSubject,
          where: { class_id: targetClass.id },
          include: [
            { model: Subject, attributes: ['name'] },
            { model: User, attributes: ['first_name', 'last_name'] } // Вчитель
          ]
        }
      ],
      order: [['day_of_week', 'ASC'], ['lesson_number', 'ASC']]
    });

    // Форматуємо дані для фронтенду, щоб вони відповідали нашій таблиці
    const formattedSchedule = schedule.map((s: any) => ({
      day: s.day_of_week,
      lessonNum: s.lesson_number,
      subject: s.TeacherSubject.Subject.name,
      teacher: `${s.TeacherSubject.User.last_name} ${s.TeacherSubject.User.first_name[0]}.`,
      room: s.room
    }));

    res.status(200).json(formattedSchedule);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання розкладу', error: error.message });
  }
};