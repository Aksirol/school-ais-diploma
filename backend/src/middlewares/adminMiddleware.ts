import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware'; // Імпортуємо наш розширений інтерфейс

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // authMiddleware вже гарантує, що req.user існує, але ми перевіряємо ще раз
  if (req.user && req.user.role === 'admin') {
    next(); // Це адмін, пропускаємо
  } else {
    res.status(403).json({ message: 'Доступ заборонено. Потрібні права адміністратора.' });
  }
};