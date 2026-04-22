import { Request, Response } from 'express';
import { User, Student, Class } from '../models';
import { AuthRequest } from '../middlewares/authMiddleware';


export const getPendingUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({ where: { is_approved: false }, attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error) { res.status(500).json({ message: 'Помилка завантаження користувачів' }); }
};

export const approveUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ message: 'Користувача не знайдено' }); return; }
    await user.update({ is_approved: true });
    res.json({ message: 'Користувача підтверджено' });
  } catch (error) { res.status(500).json({ message: 'Помилка підтвердження' }); }
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

export const getAllActiveUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({ 
      where: { is_approved: true }, 
      attributes: { exclude: ['password'] },
      order: [['role', 'ASC'], ['last_name', 'ASC']]
    });
    res.json(users);
  } catch (error) { res.status(500).json({ message: 'Помилка завантаження' }); }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findByPk(id);
    
    if (!user) { res.status(404).json({ message: 'Користувача не знайдено' }); return; }
    if (user.id === req.user!.id) { res.status(400).json({ message: 'Ви не можете змінити власну роль' }); return; }

    await user.update({ role });
    res.json({ message: 'Роль оновлено', user });
  } catch (error) { res.status(500).json({ message: 'Помилка оновлення ролі' }); }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) { res.status(404).json({ message: 'Користувача не знайдено' }); return; }
    if (user.id === req.user!.id) { res.status(400).json({ message: 'Ви не можете видалити самі себе' }); return; }

    await user.destroy();
    res.json({ message: 'Користувача видалено' });
  } catch (error) { res.status(500).json({ message: 'Помилка видалення' }); }
};