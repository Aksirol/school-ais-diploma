import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Attendance, Student, TeacherSubject } from '../models';

export const saveAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, teacher_subject_id, records } = req.body; 
    // records - об'єкт формату { studentId: 'present' | 'absent' | 'late' }
    const user = req.user!;

    const assignment = await TeacherSubject.findOne({ where: { id: teacher_subject_id, teacher_id: user.id } });
    if (!assignment && user.role !== 'admin') {
      res.status(403).json({ message: 'Доступ заборонено' });
      return;
    }

    // Формуємо масив для збереження
    const attendanceData = Object.entries(records).map(([student_id, status]) => ({
      student_id: Number(student_id),
      teacher_subject_id,
      date,
      status
    }));

    // Зберігаємо або оновлюємо існуючі записи (якщо вчитель змінив статус)
    // Увага: для коректної роботи updateOnDuplicate у моделі Attendance має бути унікальний індекс на (student_id, teacher_subject_id, date)
    await Attendance.bulkCreate(attendanceData as any, { 
      updateOnDuplicate: ['status'] 
    });

    res.status(200).json({ message: 'Журнал відвідуваності збережено' });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка збереження відвідуваності', error: error.message });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    // Якщо учень - шукаємо його id і повертаємо лише його відвідуваність
    if (user.role === 'student') {
      const { Student, TeacherSubject, Subject } = await import('../models');
      const studentInfo = await Student.findOne({ where: { user_id: user.id } });
      if (!studentInfo) return res.json([]);
      
      const myAttendance = await Attendance.findAll({
        where: { student_id: studentInfo.id },
        include: [{ model: TeacherSubject, include: [{ model: Subject, attributes: ['name'] }] }],
        order: [['date', 'DESC']]
      });
      return res.json(myAttendance);
    }
    // Для вчителя/адміна логіка залишається (можна розширити за потреби)
    res.json([]); 
  } catch (error) { res.status(500).json({ message: 'Помилка' }); }
};