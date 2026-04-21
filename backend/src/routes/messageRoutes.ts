import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/authMiddleware';
import { 
  sendMessage, 
  sendBroadcastMessage, 
  getChatHistory, 
  getDialogues, 
  markAsRead 
} from '../controllers/messageController';

const router = Router();
router.use(authenticate);

// Ліва панель (список чатів)
router.get('/dialogues', getDialogues);

// Права панель (історія конкретного чату)
router.get('/:partnerId', getChatHistory);

// Позначити чат прочитаним
router.put('/:partnerId/read', markAsRead);

// Відправити 1 на 1
router.post('/', [
  body('receiver_id').isInt().withMessage('ID отримувача обов\'язкове'),
  body('content').notEmpty().trim().escape().withMessage('Повідомлення не може бути порожнім')
], sendMessage);

// Масова розсилка (Тільки педагог)
router.post('/broadcast', [
  body('class_id').isInt().withMessage('ID класу обов\'язкове'),
  body('content').notEmpty().trim().escape().withMessage('Повідомлення не може бути порожнім')
], sendBroadcastMessage);

export default router;