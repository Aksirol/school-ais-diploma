import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/authMiddleware';
import { 
  sendMessage, 
  sendBroadcastMessage, 
  getChatHistory, 
  getDialogues, 
  markAsRead,
  getUsersForChat,
  editMessage, 
  deleteMessage
} from '../controllers/messageController';

const router = Router();
router.use(authenticate);

// Ліва панель (список чатів)
// 1. Статичні роути (БЕЗ параметрів)
router.get('/dialogues', getDialogues);
router.put('/msg/:id', editMessage);
router.delete('/msg/:id', deleteMessage);

router.post('/broadcast', [
  body('class_id').isInt().withMessage('ID класу обов\'язкове'),
  body('content').notEmpty().trim().escape().withMessage('Повідомлення не може бути порожнім')
], sendBroadcastMessage);

router.post('/', [
  body('receiver_id').isInt().withMessage('ID отримувача обов\'язкове'),
  body('content').notEmpty().trim().escape().withMessage('Повідомлення не може бути порожнім')
], sendMessage);

// 2. Динамічні роути (З параметрами - повинні бути в кінці!)
router.get('/users', getUsersForChat);
router.get('/:partnerId', getChatHistory);
router.put('/:partnerId/read', markAsRead);

export default router;