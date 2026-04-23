import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Завантаження можливе лише для авторизованих користувачів
router.get('/:filename', authenticate, (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Файл не знайдено або він був видалений' });
  }
});

export default router;