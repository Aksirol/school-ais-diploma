import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

// Схема валідації Zod
const registerSchema = z.object({
  first_name: z.string().min(2, 'Ім\'я занадто коротке'),
  last_name: z.string().min(2, 'Прізвище занадто коротке'),
  email: z.string().email('Невірний формат email'),
  password: z.string()
    .min(8, 'Мінімум 8 символів')
    .regex(/[A-Z]/, 'Мінімум одна велика літера')
    .regex(/[0-9]/, 'Мінімум одна цифра'),
  passwordConfirm: z.string(),
  role: z.enum(['teacher', 'student'], { required_error: 'Оберіть роль' }),
  class_id: z.string().optional(),
})
.refine((data) => data.password === data.passwordConfirm, {
  message: 'Паролі не збігаються',
  path: ['passwordConfirm'],
})
.refine((data) => {
  // Якщо це учень, class_id стає обов'язковим
  if (data.role === 'student' && (!data.class_id || data.class_id === '')) {
    return false;
  }
  return true;
}, {
  message: 'Оберіть ваш клас',
  path: ['class_id'],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface ClassItem {
  id: number;
  name: string;
  year: number;
}

const Register = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student', // Роль за замовчуванням
      class_id: ''
    }
  });

  const selectedRole = watch('role');

  // Завантажуємо список класів при монтуванні компонента
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/academic/classes');
        setClasses(response.data);
      } catch (error) {
        console.error('Помилка завантаження класів:', error);
      }
    };
    fetchClasses();
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    try {
      // Формуємо payload, перетворюючи class_id у число (якщо це учень)
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        role: data.role,
        class_id: data.role === 'student' ? Number(data.class_id) : undefined,
      };

      await api.post('/auth/register', payload);
      setIsSuccess(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Помилка реєстрації. Перевірте дані.');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-primary-100 text-center">
          <div className="w-16 h-16 bg-status-success text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Реєстрація успішна!</h2>
          <p className="text-slate-600 mb-6">
            Ваш акаунт створено. Будь ласка, очікуйте підтвердження адміністратором школи.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary-400 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Повернутися до входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 py-10 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg border border-primary-100">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Реєстрація в АІС</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Вибір ролі (Перемикач) */}
          <div className="flex gap-4 p-1 bg-primary-50 rounded-lg mb-6">
            <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${selectedRole === 'student' ? 'bg-white shadow text-primary-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}>
              <input type="radio" value="student" {...register('role')} className="hidden" />
              Учень
            </label>
            <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${selectedRole === 'teacher' ? 'bg-white shadow text-primary-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}>
              <input type="radio" value="teacher" {...register('role')} className="hidden" />
              Педагог
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Прізвище *</label>
              <input
                {...register('last_name')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none ${errors.last_name ? 'border-status-danger' : 'border-gray-300'}`}
                placeholder="Коваленко"
              />
              {errors.last_name && <p className="text-status-danger text-xs mt-1">{errors.last_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Ім'я *</label>
              <input
                {...register('first_name')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none ${errors.first_name ? 'border-status-danger' : 'border-gray-300'}`}
                placeholder="Олена"
              />
              {errors.first_name && <p className="text-status-danger text-xs mt-1">{errors.first_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email *</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none ${errors.email ? 'border-status-danger' : 'border-gray-300'}`}
              placeholder="olena.k@school.ua"
            />
            {errors.email && <p className="text-status-danger text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Вибір класу (тільки для учнів) */}
          {selectedRole === 'student' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Клас *</label>
              <select
                {...register('class_id')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none bg-white ${errors.class_id ? 'border-status-danger' : 'border-gray-300'}`}
              >
                <option value="">-- Оберіть клас --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.year} / {cls.name}
                  </option>
                ))}
              </select>
              {errors.class_id && <p className="text-status-danger text-xs mt-1">{errors.class_id.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Пароль *</label>
              <input
                type="password"
                {...register('password')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none ${errors.password ? 'border-status-danger' : 'border-gray-300'}`}
              />
              {errors.password && <p className="text-status-danger text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Повторіть пароль *</label>
              <input
                type="password"
                {...register('passwordConfirm')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none ${errors.passwordConfirm ? 'border-status-danger' : 'border-gray-300'}`}
              />
              {errors.passwordConfirm && <p className="text-status-danger text-xs mt-1">{errors.passwordConfirm.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-400 hover:bg-primary-600 disabled:bg-primary-100 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4"
          >
            {isSubmitting ? 'Відправка...' : 'Зареєструватися'}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-slate-500">
          Вже є акаунт? <Link to="/login" className="text-primary-600 hover:underline">Увійти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;