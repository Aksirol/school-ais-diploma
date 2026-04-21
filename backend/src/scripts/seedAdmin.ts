import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, sequelize } from '../config/database';
import { User } from '../models';

dotenv.config();

const createAdmin = async () => {
  await connectDB();
  
  try {
    const salt = await bcrypt.genSalt(10);
    // Беремо пароль з .env, або ставимо фолбек для тестування
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'; 
    const password_hash = await bcrypt.hash(adminPassword, salt);

    await User.findOrCreate({
      where: { email: 'admin@school.ua' },
      defaults: {
        first_name: 'Головний',
        last_name: 'Адміністратор',
        email: 'admin@school.ua',
        password_hash,
        role: 'admin',
        is_approved: true // Адмін завжди підтверджений
      }
    });

    console.log('✅ Акаунт адміністратора успішно створено!');
  } catch (error) {
    console.error('❌ Помилка створення адміністратора:', error);
  } finally {
    await sequelize.close();
  }
};

createAdmin();