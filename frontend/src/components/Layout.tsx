import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react'; // Іконки

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'admin': return 'Адміністратор';
      case 'teacher': return 'Педагог';
      case 'student': return 'Учень';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Хедер */}
      <header className="bg-primary-100 shadow-sm border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600">
                АІС «Навчальний процес»
              </Link>
            </div>
            
            <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700 leading-tight">
                  {user?.last_name} {user?.first_name}
                </p>
                <p className="text-xs text-slate-500 font-medium capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                {user?.last_name[0]}{user?.first_name[0]}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Основний контент (сюди будуть підставлятися інші сторінки) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;