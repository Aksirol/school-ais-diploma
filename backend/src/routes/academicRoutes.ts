import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';
import { createClass, getClasses, createSubject, getSubjects } from '../controllers/academicController';

const router = Router();

// Публічний роут (без authenticate), щоб учень міг завантажити список класів під час реєстрації
router.get('/classes', getClasses);

// Всі наступні роути вимагають авторизації
router.use(authenticate);

// Створення класу (лише Адмін)
router.post('/classes', isAdmin, createClass);

// Отримання предметів (усі авторизовані)
router.get('/subjects', getSubjects);

// Створення предмета (лише Адмін)
router.post('/subjects', isAdmin, createSubject);

export default router;