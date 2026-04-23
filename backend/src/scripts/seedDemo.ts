import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { 
  User, Class, Subject, Student, TeacherSubject, 
  Schedule, Homework, Grade, Attendance, Material 
} from '../models';

const seedDemo = async () => {
  try {
    console.log('🚀 Початок заповнення бази даних демо-даними...');
    
    // Очищення бази перед заповненням (опціонально, але корисно для чистого демо)
    await sequelize.sync({ force: true });
    console.log('🧹 Базу очищено.');

    const salt = await bcrypt.genSalt(10);
    const demoPassword = await bcrypt.hash('password123', salt);

    // 1. ПРЕДМЕТИ
    const subjects = await Subject.bulkCreate([
      { name: 'Математика' },
      { name: 'Українська мова' },
      { name: 'Фізика' },
      { name: 'Історія' },
      { name: 'Англійська мова' }
    ]);
    console.log('📚 Предмети створено.');

    // 2. КЛАСИ
    const classes = await Class.bulkCreate([
      { name: '10-А', year: 2025 },
      { name: '11-Б', year: 2025 }
    ]);
    console.log('🏫 Класи створено.');

    // 3. КОРИСТУВАЧІ (Адмін, Вчителі, Учні)
    const users = await User.bulkCreate([
      { first_name: 'Андрій', last_name: 'Адмінченко', email: 'admin@school.com', password_hash: demoPassword, role: 'admin', is_approved: true },
      // Вчителі
      { first_name: 'Олена', last_name: 'Петренко', middle_name: 'Сергіївна', email: 'petrenko@school.com', password_hash: demoPassword, role: 'teacher', is_approved: true },
      { first_name: 'Іван', last_name: 'Сидоренко', middle_name: 'Миколайович', email: 'sidorenko@school.com', password_hash: demoPassword, role: 'teacher', is_approved: true },
      // Учні 10-А
      { first_name: 'Максим', last_name: 'Коваленко', email: 'kovalenko@mail.com', password_hash: demoPassword, role: 'student', is_approved: true },
      { first_name: 'Марія', last_name: 'Шевченко', email: 'shevchenko@mail.com', password_hash: demoPassword, role: 'student', is_approved: true },
      // Учень 11-Б
      { first_name: 'Артем', last_name: 'Бондар', email: 'bondar@mail.com', password_hash: demoPassword, role: 'student', is_approved: true }
    ]);
    console.log('👤 Користувачів створено.');

    // 4. СТУДЕНТИ (Зв'язок User + Class)
    const students = await Student.bulkCreate([
      { user_id: users[3].id, class_id: classes[0].id }, // Максим -> 10-А
      { user_id: users[4].id, class_id: classes[0].id }, // Марія -> 10-А
      { user_id: users[5].id, class_id: classes[1].id }  // Артем -> 11-Б
    ]);
    console.log('🎓 Студентів закріплено за класами.');

    // 5. ПРИЗНАЧЕННЯ (Teacher + Class + Subject)
    const assignments = await TeacherSubject.bulkCreate([
      { teacher_id: users[1].id, class_id: classes[0].id, subject_id: subjects[0].id }, // Петренко -> 10-А -> Математика
      { teacher_id: users[1].id, class_id: classes[0].id, subject_id: subjects[4].id }, // Петренко -> 10-А -> Англійська
      { teacher_id: users[2].id, class_id: classes[1].id, subject_id: subjects[2].id }  // Сидоренко -> 11-Б -> Фізика
    ]);
    console.log('🔗 Навантаження вчителів сформовано.');

    // 6. РОЗКЛАД
    await Schedule.bulkCreate([
      { class_id: classes[0].id, teacher_subject_id: assignments[0].id, day_of_week: 1, lesson_number: 1, room: '204' },
      { class_id: classes[0].id, teacher_subject_id: assignments[1].id, day_of_week: 1, lesson_number: 2, room: '101' }
    ]);
    console.log('📅 Розклад заповнено.');

    // 7. ДОМАШНІ ЗАВДАННЯ
    const homeworks = await Homework.bulkCreate([
      { 
        title: 'Квадратні рівняння', 
        description: 'Розв\'язати вправи 120-135 на стор. 45', 
        due_date: '2025-05-20', 
        teacher_subject_id: assignments[0].id 
      }
    ]);
    console.log('📝 Домашні завдання додано.');

    // 8. МАТЕРІАЛИ
    await Material.bulkCreate([
      { title: 'Підручник Алгебра 10 клас', type: 'link', url: 'https://mon.gov.ua/algebra10', teacher_subject_id: assignments[0].id }
    ]);
    console.log('📁 Матеріали завантажено.');

    // 9. ОЦІНКИ (Минулі дати)
    await Grade.bulkCreate([
      { student_id: students[0].id, teacher_subject_id: assignments[0].id, value: 11, grade_date: '2025-05-10', comment: 'Відмінна робота біля дошки' },
      { student_id: students[1].id, teacher_subject_id: assignments[0].id, value: 8, grade_date: '2025-05-10' }
    ]);
    console.log('💯 Журнал оцінок заповнено.');

    // 10. ВІДВІДУВАНІСТЬ
    await Attendance.bulkCreate([
      { student_id: students[0].id, teacher_subject_id: assignments[0].id, lesson_date: '2025-05-10', status: 'present' },
      { student_id: students[1].id, teacher_subject_id: assignments[0].id, lesson_date: '2025-05-10', status: 'absent' }
    ]);
    console.log('✅ Відвідуваність відмічено.');

    console.log('✨ Всі демо-дані успішно завантажено!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка під час заповнення бази:', error);
    process.exit(1);
  }
};

seedDemo();