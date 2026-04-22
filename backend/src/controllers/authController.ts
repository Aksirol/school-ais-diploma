import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Student } from '../models';
import { sequelize } from '../config/database';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  // Використовуємо транзакцію для безпечного запису в кілька таблиць
  const t = await sequelize.transaction();

  try {
    // 1. Перевірка на помилки валідації
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const { first_name, last_name, email, password, role, class_id } = req.body;

    // Перевірка, чи існує вже такий email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Користувач з таким email вже існує.' });
      return;
    }

    // Хешування пароля
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Створення користувача (is_approved за замовчуванням false згідно моделі)
    const newUser = await User.create(
      { first_name, last_name, email, password_hash, role },
      { transaction: t }
    );

    // Якщо це учень, одразу створюємо запис-прив'язку до класу
    if (role === 'student') {
      if (!class_id) {
        throw new Error('Для реєстрації учня необхідно вказати ID класу.');
      }
      await Student.create(
        { user_id: newUser.id, class_id },
        { transaction: t }
      );
    }

    // Підтверджуємо транзакцію (зберігаємо дані)
    await t.commit();

    res.status(201).json({ 
      message: 'Реєстрація успішна. Очікуйте підтвердження адміністратором.' 
    });
  } catch (error: any) {
    // Відкочуємо транзакцію у разі помилки
    await t.rollback();
    res.status(500).json({ message: 'Помилка реєстрації', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Перевірка на помилки валідації
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Шукаємо користувача
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Невірний email або пароль.' });
      return;
    }

    // Перевіряємо пароль
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: 'Невірний email або пароль.' });
      return;
    }

    // Перевіряємо статус підтвердження (адміна пускаємо завжди)
    if (!user.is_approved && user.role !== 'admin') {
      res.status(403).json({ message: 'Ваш акаунт ще не підтверджено адміністратором.' });
      return;
    }

    // Генеруємо JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' } // Термін дії 8 годин
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Помилка авторизації' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { first_name, last_name, current_password, new_password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'Користувача не знайдено' });
      return;
    }

    // Оновлення ПІБ
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;

    // Оновлення пароля
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ message: 'Введіть поточний пароль для підтвердження' });
        return;
      }
      
      // ВИПРАВЛЕНО: Використовуємо getDataValue для читання
      const isMatch = await bcrypt.compare(current_password, user.getDataValue('password'));
      if (!isMatch) {
        res.status(400).json({ message: 'Поточний пароль невірний' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      // ВИПРАВЛЕНО: Використовуємо setDataValue для запису
      user.setDataValue('password', await bcrypt.hash(new_password, salt));
    }

    await user.save();
    
    // Не повертаємо пароль на клієнт
    res.json({ 
      id: user.id, 
      first_name: user.first_name, 
      last_name: user.last_name, 
      email: user.email, 
      role: user.role 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка оновлення профілю', error: error.message });
  }
};