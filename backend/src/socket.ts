import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;
let onlineUsers = new Set<number>();

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', 
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  // Middleware для авторизації сокет-з'єднання
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Токен відсутній'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; role: string };
      (socket as any).userId = decoded.id; 
      next();
    } catch (error) {
      return next(new Error('Недійсний токен'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`🟢 Користувач підключився (ID: ${userId})`);

    // 1. Приєднуємо до персональної кімнати
    socket.join(`user_${userId}`);
    
    // 2. Додаємо до списку онлайн і сповіщаємо всіх
    onlineUsers.add(userId);
    io.emit('userStatusChanged', { userId, status: 'online' });
    
    // 3. Відправляємо поточному юзеру список тих, хто вже онлайн
    socket.emit('onlineUsersList', Array.from(onlineUsers));

    socket.on('disconnect', () => {
      console.log(`🔴 Користувач відключився (ID: ${userId})`);
      onlineUsers.delete(userId);
      io.emit('userStatusChanged', { userId, status: 'offline' });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO не ініціалізовано!');
  return io;
};