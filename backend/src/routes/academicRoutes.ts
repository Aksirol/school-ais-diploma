import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';
import { createClass, getClasses, createSubject, getSubjects, updateSubject, deleteSubject, deleteClass, updateClass } from '../controllers/academicController';

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

router.put('/classes/:id', isAdmin, updateClass);
router.delete('/classes/:id', isAdmin, deleteClass);

router.put('/subjects/:id', isAdmin, updateSubject);
router.delete('/subjects/:id', isAdmin, deleteSubject);

export default router;