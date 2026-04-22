import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, updateProfile } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Правила валідації для реєстрації
const registerValidation = [
  body('email').isEmail().withMessage('Невірний формат email або email відсутній'),
  body('password').isLength({ min: 8 }).withMessage('Пароль має містити мінімум 8 символів'),
  body('first_name').notEmpty().trim().escape().withMessage('Ім\'я обов\'язкове'),
  body('last_name').notEmpty().trim().escape().withMessage('Прізвище обов\'язкове'),
  body('role').isIn(['teacher', 'student']).withMessage('Недопустима роль. Доступні лише teacher та student')
];

const loginValidation = [
  body('email').isEmail().withMessage('Невірний формат email або email відсутній'),
  body('password').notEmpty().withMessage('Пароль обов\'язковий'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.put('/profile', authenticate, updateProfile);

export default router;