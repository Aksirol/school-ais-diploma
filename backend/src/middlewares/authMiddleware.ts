import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Розширюємо стандартний Request, щоб додати туди дані користувача
export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: 'admin' | 'teacher' | 'student';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Немає доступу. Токен відсутній.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; role: 'admin' | 'teacher' | 'student' };
    req.user = decoded;
    next(); // Токен валідний, пропускаємо далі
  } catch (error) {
    res.status(403).json({ message: 'Токен недійсний або його термін дії закінчився.' });
  }
};