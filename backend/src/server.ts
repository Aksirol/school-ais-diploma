import http from 'http';
import { initSocket } from './socket';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/database';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import academicRoutes from './routes/academicRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import materialRoutes from './routes/materialRoutes';
import gradeRoutes from './routes/gradeRoutes';
import path from 'path'; 
import messageRoutes from './routes/messageRoutes';
import homeworkRoutes from './routes/homeworkRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

// Імпортуємо головний файл моделей, щоб Sequelize знав про них і їхні зв'язки
// ДО того, як відбудеться синхронізація
import './models'; 

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// --- Мідлвари (Middlewares) ---
const corsOptions = {
  // Дозволяємо доступ тільки з фронтенду (локально або з домену продакшену)
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true, // Дозволяє передавати куки/токени авторизації
};
app.use(cors(corsOptions)); // Дозволяє фронтенду робити запити до бекенду
app.use(express.json()); // Дозволяє серверу розуміти JSON у тілі запиту
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/api/homework', homeworkRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedule', scheduleRoutes);

app.use('/api/materials', materialRoutes);
app.use('/api/grades', gradeRoutes);

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
    await connectDB();
    // СИНХРОНІЗАЦІЯ БАЗИ ДАНИХ
    // Увага: alter: true використовується виключно для середовища розробки.
    // На продакшені (NODE_ENV === 'production') синхронізацію слід вимкнути 
    // і використовувати виключно механізм міграцій (наприклад, Umzug) 
    // для уникнення ризику випадкової втрати даних при зміні типів колонок.
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      
      if (!process.env.JWT_SECRET) {
        console.error('КРИТИЧНА ПОМИЛКА: Змінна середовища JWT_SECRET не задана!');
        console.error('Сервер зупинено. Додайте JWT_SECRET у файл .env');
        process.exit(1); // Зупиняємо процес з кодом помилки
      }

      await sequelize.sync({ alter: true });
      console.log('Таблиці бази даних успішно синхронізовано (Development mode).');
    } else {
      console.log('База даних підключена (Production mode - міграції застосовуються окремо).');
    }
    console.log('Таблиці бази даних успішно синхронізовано.');

    // СТВОРЮЄМО HTTP СЕРВЕР ТА ПІДКЛЮЧАЄМО СОКЕТИ:
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    // ВАЖЛИВО: Запускаємо httpServer, а не app
    httpServer.listen(PORT, () => {
      console.log(`🚀 Сервер та WebSockets запущено на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Критична помилка при запуску сервера:', error);
    process.exit(1);
  }
};

startServer();