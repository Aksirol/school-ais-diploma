import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Для дипломної залишимо '*', на продакшені тут має бути URL фронтенду
      methods: ['GET', 'POST']
    }
  });

  // Middleware для авторизації сокет-з'єднання (перевіряємо JWT)
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Помилка авторизації: Токен відсутній'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; role: string };
      // Зберігаємо ID користувача прямо в об'єкті сокета для подальшого використання
      (socket as any).userId = decoded.id; 
      next();
    } catch (error) {
      return next(new Error('Помилка авторизації: Недійсний токен'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`🟢 Користувач підключився до WebSockets (ID: ${userId})`);

    // Створюємо "персональну кімнату" для кожного користувача.
    // Це дозволить нам відправляти повідомлення конкретній людині за її ID.
    socket.join(`user_${userId}`);

    socket.on('disconnect', () => {
      console.log(`🔴 Користувач відключився (ID: ${userId})`);
    });
  });

  return io;
};

// Функція для отримання інстансу io в контролерах
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO не ініціалізовано!');
  }
  return io;
};