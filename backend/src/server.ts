import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/database';

// Імпортуємо головний файл моделей, щоб Sequelize знав про них і їхні зв'язки
// ДО того, як відбудеться синхронізація
import './models'; 

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// --- Мідлвари (Middlewares) ---
app.use(cors()); // Дозволяє фронтенду робити запити до бекенду
app.use(express.json()); // Дозволяє серверу розуміти JSON у тілі запиту
app.use(express.urlencoded({ extended: true }));

// --- Тестовий роут ---
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Бекенд АІС "Навчальний процес" успішно працює!' 
  });
});

// --- Ініціалізація сервера та бази даних ---
const startServer = async () => {
  try {
    // 1. Підключаємось до PostgreSQL
    await connectDB();

    // 2. Синхронізуємо моделі
    // alter: true вказує Sequelize порівняти поточні моделі з таблицями в БД 
    // і безпечно внести зміни (додати нові колонки/таблиці), не видаляючи дані.
    // Це ідеально для розробки. Для продакшену зазвичай використовують міграції.
    await sequelize.sync({ alter: true });
    console.log('Таблиці бази даних успішно синхронізовано.');

    // 3. Запускаємо сервер
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Критична помилка при запуску сервера:', error);
    process.exit(1);
  }
};

startServer();