import { getIO } from '../socket';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { validationResult } from 'express-validator';
import { Message, User, Student, TeacherSubject } from '../models';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

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

    // ВИПРАВЛЕНО: Один виклик bulkCreate з правильною змінною (messagesData)
    const createdMessages = await Message.bulkCreate(messagesData, { returning: true });

    // Одразу відправляємо у сокети створені повідомлення
    createdMessages.forEach((msg: any) => {
      // ВИПРАВЛЕНО: Використовуємо правильну назву кімнати (user_ID)
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

    // Крок 1: Знаходимо ID останніх повідомлень для кожного унікального діалогу
    // Використовуємо LEAST і GREATEST, щоб (1->2) і (2->1) вважалися одним діалогом
    const latestMessageIds: any = await Message.findAll({
      attributes: [
        [sequelize.fn('MAX', sequelize.col('id')), 'max_id']
      ],
      where: {
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }]
      },
      group: [
        sequelize.fn('LEAST', sequelize.col('sender_id'), sequelize.col('receiver_id')),
        sequelize.fn('GREATEST', sequelize.col('sender_id'), sequelize.col('receiver_id'))
      ],
      raw: true
    });

    if (!latestMessageIds || latestMessageIds.length === 0) {
      res.json([]);
      return;
    }

    const ids = latestMessageIds.map((m: any) => m.max_id);

    // Крок 2: Витягуємо самі повідомлення разом з іменами партнерів
    const recentMessages = await Message.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'first_name', 'last_name', 'role'] },
        { model: User, as: 'Receiver', attributes: ['id', 'first_name', 'last_name', 'role'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Крок 3: Форматуємо для фронтенду
    const dialogues = recentMessages.map((msg: any) => {
      const isSender = msg.sender_id === userId;
      const partner = isSender ? msg.Receiver : msg.Sender;
      return {
        partnerId: partner.id,
        partnerName: `${partner.last_name} ${partner.first_name}`,
        partnerRole: partner.role,
        lastMessage: msg.content,
        timestamp: msg.created_at,
        unreadCount: isSender ? 0 : (msg.is_read ? 0 : 1) // Базовий підрахунок непрочитаних
      };
    });

    res.json(dialogues);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка завантаження діалогів' });
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