import { Request, Response } from 'express';
import { User, Student, Class } from '../models';
import { AuthRequest } from '../middlewares/authMiddleware';

// Отримати всіх користувачів, які очікують підтвердження
export const getPendingUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      where: { is_approved: false },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'created_at'],
      include: [
        {
          model: Student, // Якщо це учень, підтягуємо його заявку на клас
          include: [{ model: Class, attributes: ['id', 'name'] }]
        }
      ]
    });
    
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка отримання списку користувачів', error: error.message });
  }
};

// Підтвердити реєстрацію
export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ message: 'Користувача не знайдено' });
      return;
    }

    user.is_approved = true;
    await user.save();

    res.status(200).json({ message: 'Акаунт успішно підтверджено' });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка підтвердження', error: error.message });
  }
};

// Відхилити (видалити) реєстрацію
export const rejectUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ message: 'Користувача не знайдено' });
      return;
    }

    // Завдяки onDelete: 'CASCADE' в моделі Student, 
    // запис-прив'язка учня до класу видалиться автоматично разом з користувачем
    await user.destroy();

    res.status(200).json({ message: 'Заявку відхилено, акаунт видалено' });
  } catch (error: any) {
    res.status(500).json({ message: 'Помилка відхилення', error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    await user.destroy();
    res.json({ message: 'Користувача видалено з системи' });
  } catch (error: any) { res.status(500).json({ message: 'Помилка видалення' }); }
};