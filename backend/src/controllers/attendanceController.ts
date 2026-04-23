import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Attendance, Student, TeacherSubject } from '../models';

export const saveAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, teacher_subject_id, records } = req.body;

    // 1. Видаляємо старі записи на цю дату для цього предмета (запобігаємо дублікатам)
    await Attendance.destroy({ 
      where: { teacher_subject_id, lesson_date: date } 
    });

    // 2. Формуємо масив для нового збереження (мапимо date -> lesson_date)
    const attendanceData = Object.entries(records).map(([student_id, status]) => ({
      student_id: Number(student_id),
      teacher_subject_id: Number(teacher_subject_id),
      lesson_date: date, // Ось тут відбувається правильний мапінг!
      status
    }));

    await Attendance.bulkCreate(attendanceData);
    
    res.status(201).json({ message: 'Відвідуваність збережено' });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка збереження відвідуваності' });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { Student, TeacherSubject, Subject, User } = await import('../models');

    // ЛОГІКА ДЛЯ УЧНЯ
    if (user.role === 'student') {
      const studentInfo = await Student.findOne({ where: { user_id: user.id } });
      if (!studentInfo) { res.json([]); return; }
      
      const myAttendance = await Attendance.findAll({
        where: { student_id: studentInfo.id },
        include: [{ model: TeacherSubject, include: [{ model: Subject, attributes: ['name'] }] }],
        order: [['lesson_date', 'DESC']] // Виправлено на lesson_date
      });
      res.json(myAttendance);
      return;
    }

    // ЛОГІКА ДЛЯ ВЧИТЕЛЯ ТА АДМІНА (отримання по фільтрах)
    const { teacher_subject_id, date } = req.query;
    const whereClause: any = {};
    if (teacher_subject_id) whereClause.teacher_subject_id = teacher_subject_id;
    if (date) whereClause.lesson_date = date;

    const classAttendance = await Attendance.findAll({
      where: whereClause,
      include: [
        { model: Student, include: [{ model: User, attributes: ['first_name', 'last_name', 'middle_name'] }] }
      ]
    });
    
    res.json(classAttendance);
  } catch (error) { 
    res.status(500).json({ message: 'Помилка завантаження відвідуваності' }); 
  }
};