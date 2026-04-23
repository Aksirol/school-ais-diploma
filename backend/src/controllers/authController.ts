import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Student } from '../models';
import { sequelize } from '../config/database';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  // ІНІЦІАЛІЗАЦІЯ ТРАНЗАКЦІЇ
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        message: 'Помилка валідації даних', 
        errors: errors.array() 
      });
      return;
    }

    const { first_name, last_name, middle_name, email, password, role, class_id } = req.body;

    if (role === 'teacher' && (!middle_name || middle_name.trim() === '')) {
      await t.rollback(); // Відкочуємо транзакцію при помилці
      res.status(400).json({ message: 'Для педагога обов\'язково вказувати по батькові' });
      return;
    }

    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) {
      await t.rollback();
      res.status(400).json({ message: 'Користувач з таким email вже існує.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    
    // Створення користувача в межах транзакції
    const newUser = await User.create({
      first_name,
      last_name,
      middle_name, 
      email,
      password_hash: await bcrypt.hash(password, salt),
      role,
      class_id: role === 'student' ? class_id : null,
      is_approved: role === 'admin',
    }, { transaction: t });

    if (role === 'student') {
      if (!class_id) {
        await t.rollback();
        res.status(400).json({ message: 'Для реєстрації учня необхідно вказати ID класу.' });
        return;
      }
      await Student.create(
        { user_id: newUser.id, class_id },
        { transaction: t }
      );
    }

    await t.commit(); // Успішно зберігаємо всі дані
    res.status(201).json({ message: 'Реєстрація успішна. Очікуйте підтвердження адміністратором.' });
  } catch (error: any) {
    await t.rollback();
    res.status(500).json({ message: 'Помилка реєстрації', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Невірний email або пароль.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.getDataValue('password_hash'));
    if (!isMatch) {
      res.status(401).json({ message: 'Невірний email або пароль.' });
      return;
    }

    if (!user.is_approved && user.role !== 'admin') {
      res.status(403).json({ message: 'Ваш акаунт ще не підтверджено адміністратором.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.getDataValue('middle_name'), // Додаємо по батькові у відповідь логіну
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
    // ДОДАНО middle_name ТУТ:
    const { first_name, last_name, middle_name, current_password, new_password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'Користувача не знайдено' });
      return;
    }

    // Оновлення ПІБ
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    
    // БЕЗПЕЧНЕ ОНОВЛЕННЯ middle_name
    if (middle_name !== undefined) user.setDataValue('middle_name', middle_name);

    // Оновлення пароля
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ message: 'Введіть поточний пароль для підтвердження' });
        return;
      }
      
      const isMatch = await bcrypt.compare(current_password, user.getDataValue('password_hash'));
      if (!isMatch) {
        res.status(400).json({ message: 'Поточний пароль невірний' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.setDataValue('password_hash', await bcrypt.hash(new_password, salt));
    }

    await user.save();
    
    res.json({ 
      id: user.id, 
      first_name: user.first_name, 
      last_name: user.last_name, 
      middle_name: user.getDataValue('middle_name'),
      email: user.email, 
      role: user.role 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка оновлення профілю', error: error.message });
  }
};