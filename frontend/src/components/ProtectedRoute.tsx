import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'teacher' | 'student')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Завантаження...</div>;
  }

  // Якщо користувач не авторизований
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Якщо сторінка вимагає певних ролей, а у користувача її немає
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Перенаправляємо на головну
  }

  // Якщо все добре — рендеримо дочірні компоненти (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;