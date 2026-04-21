import { getIO } from '../socket';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { validationResult } from 'express-validator';
import { Message, User, Student, TeacherSubject } from '../models';
import { Op } from 'sequelize';

// 1. Відправити повідомлення (1 на 1)
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { receiver_id, content } = req.body;
    const sender_id = req.user!.id;

    // Перевіряємо, чи існує отримувач
    const receiver = await User.findByPk(receiver_id);
    if (!receiver) {
      res.status(404).json({ message: 'Отримувача не знайдено' });
      return;
    }

    const message = await Message.create({ sender_id, receiver_id, content });
    
    // ВІДПРАВКА СОКЕТ-ПОДІЇ ОТРИМУВАЧУ
    getIO().to(`user_${receiver_id}`).emit('newMessage', message);
    // Відправляємо подію також і відправнику (щоб його UI оновився миттєво на іншому пристрої)
    getIO().to(`user_${sender_id}`).emit('newMessage', message);

    res.status(201).json({ message: 'Відправлено', data: message });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка відправки', error: error.message });
  }
};

// 2. Масова розсилка всьому класу (тільки для педагога)
export const sendBroadcastMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { class_id, content } = req.body;
    const user = req.user!;

    if (user.role !== 'teacher') {
      res.status(403).json({ message: 'Тільки педагоги можуть робити розсилку' });
      return;
    }

    // Перевіряємо, чи викладає цей педагог у цьому класі
    const assignment = await TeacherSubject.findOne({ where: { teacher_id: user.id, class_id } });
    if (!assignment) {
      res.status(403).json({ message: 'Ви не викладаєте в цьому класі' });
      return;
    }

    // Знаходимо всіх учнів цього класу
    const students = await Student.findAll({ where: { class_id } });
    if (students.length === 0) {
      res.status(404).json({ message: 'У цьому класі немає учнів' });
      return;
    }

    // Формуємо масив повідомлень для bulkCreate
    const messagesData = students.map(student => ({
      sender_id: user.id,
      receiver_id: student.user_id,
      content
    }));

    await Message.bulkCreate(messagesData);

    // Отримуємо збережені повідомлення (щоб мати ID та дати) і розсилаємо
    const savedMessages = await Message.findAll({
      where: { sender_id: user.id, content },
      order: [['id', 'DESC']],
      limit: students.length
    });

    savedMessages.forEach(msg => {
      getIO().to(`user_${msg.receiver_id}`).emit('newMessage', msg);
    });

    res.status(201).json({ message: `Повідомлення надіслано ${students.length} учням` });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка розсилки', error: error.message });
  }
};

// 3. Отримати історію чату з конкретним користувачем (Права панель)
export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const partnerId = req.params.partnerId;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: partnerId },
          { sender_id: partnerId, receiver_id: userId }
        ]
      },
      order: [['sent_at', 'ASC']] // Від найстаріших до найновіших (як у месенджерах)
    });

    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання чату', error: error.message });
  }
};

// 4. Отримати список діалогів (Ліва панель месенджера)
export const getDialogues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Шукаємо всі повідомлення, де користувач є відправником або отримувачем
    const allMessages = await Message.findAll({
      where: { [Op.or]: [{ sender_id: userId }, { receiver_id: userId }] },
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'first_name', 'last_name', 'role'] },
        { model: User, as: 'Receiver', attributes: ['id', 'first_name', 'last_name', 'role'] }
      ],
      order: [['sent_at', 'DESC']]
    });

    // Групуємо повідомлення по співрозмовниках за допомогою JS
    // Групуємо повідомлення по співрозмовниках
    const dialoguesMap = new Map();

    allMessages.forEach(msg => {
      // Конвертуємо екземпляр Sequelize у звичайний об'єкт і кажемо TS "довірся мені"
      const msgData = msg.get({ plain: true }) as any; 
      
      // Визначаємо, хто є співрозмовником
      const partner = msgData.sender_id === userId ? msgData.Receiver : msgData.Sender;

      if (!dialoguesMap.has(partner.id)) {
        dialoguesMap.set(partner.id, {
          partner: partner,
          lastMessage: { content: msgData.content, sent_at: msgData.sent_at, is_mine: msgData.sender_id === userId },
          unreadCount: 0
        });
      }

      // Якщо повідомлення від співрозмовника і воно не прочитане
      if (msgData.sender_id === partner.id && !msgData.is_read) {
        dialoguesMap.get(partner.id).unreadCount += 1;
      }
    });

    res.status(200).json(Array.from(dialoguesMap.values()));
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка завантаження діалогів', error: error.message });
  }
};

// 5. Позначити повідомлення як прочитані
// 5. Позначити повідомлення як прочитані
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const partnerId = req.params.partnerId;

    // Позначаємо прочитаними всі повідомлення ВІД партнера ДО нас
    const [updatedCount] = await Message.update(
      { is_read: true },
      { where: { sender_id: partnerId, receiver_id: userId, is_read: false } }
    );

    // НОВЕ: Якщо хоча б одне повідомлення змінило статус, сповіщаємо відправника через сокети
    if (updatedCount > 0) {
      const { getIO } = await import('../socket');
      // Сповіщаємо partnerId (того, хто нам писав), що userId (ми) прочитали його повідомлення
      getIO().to(`user_${partnerId}`).emit('messagesRead', { readerId: userId });
    }

    res.status(200).json({ message: 'Прочитано' });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка оновлення статусу', error: error.message });
  }
};

// Отримати список усіх підтверджених користувачів для пошуку в чаті
export const getUsersForChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      where: { is_approved: true },
      attributes: ['id', 'first_name', 'last_name', 'role'],
      order: [['last_name', 'ASC']]
    });
    // Відфільтровуємо самого себе
    const filteredUsers = users.filter(u => u.id !== req.user!.id);
    res.status(200).json(filteredUsers);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка завантаження користувачів' });
  }
};

// 6. Редагувати повідомлення
export const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const message = await Message.findByPk(id);

    if (!message) {
      res.status(404).json({ message: 'Повідомлення не знайдено' });
      return;
    }

    if (message.sender_id !== userId) {
      res.status(403).json({ message: 'Ви можете редагувати лише власні повідомлення' });
      return;
    }

    message.content = content;
    await message.save();

    // Сповіщаємо обох учасників через сокети
    const { getIO } = await import('../socket');
    getIO().to(`user_${message.receiver_id}`).emit('messageEdited', message);
    getIO().to(`user_${message.sender_id}`).emit('messageEdited', message);

    res.status(200).json(message);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка редагування', error: error.message });
  }
};

// 7. Видалити повідомлення
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const message = await Message.findByPk(id);

    if (!message) {
      res.status(404).json({ message: 'Повідомлення не знайдено' });
      return;
    }

    if (message.sender_id !== userId) {
      res.status(403).json({ message: 'Ви можете видаляти лише власні повідомлення' });
      return;
    }

    const receiverId = message.receiver_id;
    await message.destroy();

    // Сповіщаємо про видалення (передаємо ID видаленого повідомлення)
    const { getIO } = await import('../socket');
    getIO().to(`user_${receiverId}`).emit('messageDeleted', id);
    getIO().to(`user_${userId}`).emit('messageDeleted', id);

    res.status(200).json({ message: 'Видалено' });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка видалення', error: error.message });
  }
};