import { Outlet, Link, useNavigate } from 'react-router-dom';
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
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500">{getRoleName(user?.role)}</p>
              </div>
              <div className="bg-white p-2 rounded-full text-primary-400 border border-primary-200">
                <UserIcon size={20} />
              </div>
              <button 
                onClick={handleLogout}
                className="ml-2 text-slate-500 hover:text-status-danger transition-colors p-2"
                title="Вийти"
              >
                <LogOut size={20} />
              </button>
            </div>
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