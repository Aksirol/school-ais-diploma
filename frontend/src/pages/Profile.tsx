import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Lock, Save, ShieldCheck, AlertCircle, LogOut } from 'lucide-react'; // Додали LogOut
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const profileSchema = z.object({
  first_name: z.string().min(2, "Ім'я занадто коротке"),
  last_name: z.string().min(2, "Прізвище занадто коротке"),
  middle_name: z.string().optional(),
  current_password: z.string().optional(),
  new_password: z.string().min(6, "Пароль має бути мін. 6 символів").optional().or(z.literal('')),
  confirm_password: z.string().optional(),
}).refine((data) => {
  if (data.new_password && data.new_password.length > 0) {
    return data.new_password === data.confirm_password;
  }
  return true;
}, {
  message: "Паролі не збігаються",
  path: ["confirm_password"],
});

type ProfileForm = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      middle_name: user?.middle_name || ''
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      setMessage(null);
      // Відфільтровуємо порожні поля паролів перед відправкою
      const payload: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name,
      };
      if (data.new_password) {
        payload.current_password = data.current_password;
        payload.new_password = data.new_password;
      }

      const response = await api.put('/auth/profile', payload);
      updateUser(response.data);
      setMessage({ type: 'success', text: 'Профіль успішно оновлено!' });
      reset({ ...data, current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Помилка при оновленні профілю' 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.last_name[0]}{user?.first_name[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Налаштування профілю</h2>
            <p className="text-slate-500 uppercase text-xs font-bold tracking-wider mt-1">
              Роль: <span className="text-primary-500">{user?.role === 'teacher' ? 'Педагог' : user?.role === 'admin' ? 'Адміністратор' : 'Учень'}</span>
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-accent-50 text-accent-700 border border-accent-100' : 'bg-status-danger/10 text-status-danger border border-status-danger/20'}`}>
            {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Секція особистих даних */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <User size={18} className="text-primary-400" /> Основна інформація
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ім'я</label>
                <input {...register('first_name')} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none transition-all" />
                {errors.first_name && <p className="text-status-danger text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Прізвище</label>
                <input {...register('last_name')} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none transition-all" />
                {errors.last_name && <p className="text-status-danger text-xs mt-1">{errors.last_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Електронна пошта (незмінно)</label>
                <input type="text" disabled value={user?.email || ''} className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg cursor-not-allowed" />
              </div>
            </div>

            {/* Секція безпеки */}
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Lock size={18} className="text-accent-400" /> Безпека
              </h3>
              <p className="text-xs text-slate-500 mb-2">Заповніть ці поля лише якщо хочете змінити пароль.</p>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Поточний пароль</label>
                <input type="password" {...register('current_password')} placeholder="••••••••" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Новий пароль</label>
                <input type="password" {...register('new_password')} placeholder="••••••••" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent-400 outline-none" />
                {errors.new_password && <p className="text-status-danger text-xs mt-1">{errors.new_password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Підтвердьте пароль</label>
                <input type="password" {...register('confirm_password')} placeholder="••••••••" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent-400 outline-none" />
                {errors.confirm_password && <p className="text-status-danger text-xs mt-1">{errors.confirm_password.message}</p>}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
            {/* Кнопка виходу */}
            <button
              type="button"
              onClick={logout}
              className="text-status-danger hover:bg-status-danger/10 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <LogOut size={20} /> Вийти з акаунта
            </button>

            {/* Кнопка збереження */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-400 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary-100 disabled:bg-slate-300"
            >
              {isSubmitting ? 'Збереження...' : (
                <>
                  <Save size={20} /> Зберегти зміни
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;