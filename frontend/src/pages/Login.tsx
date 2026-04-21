import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(8, 'Пароль має бути не менше 8 символів'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data.token, response.data.user);
      navigate('/'); // Перехід на головну після входу
    } catch (error: any) {
      alert(error.response?.data?.message || 'Помилка входу');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-primary-100">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Вхід в АІС</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-x-0 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              {...register('email')}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
              placeholder="example@school.ua"
            />
            {errors.email && <p className="text-status-danger text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Пароль</label>
            <input
              type="password"
              {...register('password')}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
            />
            {errors.password && <p className="text-status-danger text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-primary-400 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Увійти
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Ще не маєте акаунту? <Link to="/register" className="text-primary-600 hover:underline">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;