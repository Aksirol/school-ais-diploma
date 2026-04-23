import { User } from './User';
import { Class } from './Class';
import { Subject } from './Subject';
import { Student } from './Student';
import { TeacherSubject } from './TeacherSubject';
import { Grade } from './Grade';
import { Attendance } from './Attendance';
import { Schedule } from './Schedule';
import { Homework } from './Homework';
import { Material } from './Material';
import { Message } from './Message';
import HomeworkSubmission from './HomeworkSubmission';

// --- НАЛАШТУВАННЯ ЗВ'ЯЗКІВ (FOREIGN KEYS) ---

// 1. Користувачі, Учні, Класи та Предмети (з попереднього кроку)
User.hasOne(Student, { foreignKey: 'user_id' });
Student.belongsTo(User, { foreignKey: 'user_id' });

Class.hasMany(Student, { foreignKey: 'class_id' });
Student.belongsTo(Class, { foreignKey: 'class_id' });

User.hasMany(TeacherSubject, { foreignKey: 'teacher_id' });
TeacherSubject.belongsTo(User, { foreignKey: 'teacher_id' });

Subject.hasMany(TeacherSubject, { foreignKey: 'subject_id' });
TeacherSubject.belongsTo(Subject, { foreignKey: 'subject_id' });

Class.hasMany(TeacherSubject, { foreignKey: 'class_id' });
TeacherSubject.belongsTo(Class, { foreignKey: 'class_id' });

// 2. Оцінки та Відвідуваність
Student.hasMany(Grade, { foreignKey: 'student_id' });
Grade.belongsTo(Student, { foreignKey: 'student_id' });

TeacherSubject.hasMany(Grade, { foreignKey: 'teacher_subject_id' });
Grade.belongsTo(TeacherSubject, { foreignKey: 'teacher_subject_id' });

Student.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(Student, { foreignKey: 'student_id' });

TeacherSubject.hasMany(Attendance, { foreignKey: 'teacher_subject_id' });
Attendance.belongsTo(TeacherSubject, { foreignKey: 'teacher_subject_id' });

// 3. Розклад, Домашні завдання та Матеріали
TeacherSubject.hasMany(Schedule, { foreignKey: 'teacher_subject_id' });
Schedule.belongsTo(TeacherSubject, { foreignKey: 'teacher_subject_id' });

TeacherSubject.hasMany(Homework, { foreignKey: 'teacher_subject_id' });
Homework.belongsTo(TeacherSubject, { foreignKey: 'teacher_subject_id' });

TeacherSubject.hasMany(Material, { foreignKey: 'teacher_subject_id' });
Material.belongsTo(TeacherSubject, { foreignKey: 'teacher_subject_id' });

// 4. Повідомлення (Месенджер)
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'sender_id' });

User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'receiver_id' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiver_id' });

// --- ЗДАЧА ДОМАШНІХ ЗАВДАНЬ ---
Homework.hasMany(HomeworkSubmission, { foreignKey: 'homework_id' });
HomeworkSubmission.belongsTo(Homework, { foreignKey: 'homework_id' });

Student.hasMany(HomeworkSubmission, { foreignKey: 'student_id' });
HomeworkSubmission.belongsTo(Student, { foreignKey: 'student_id' });

// Експортуємо всі 11 моделей
export { 
  User, Class, Subject, Student, TeacherSubject, 
  Grade, Attendance, Schedule, Homework, Material, Message, HomeworkSubmission
};