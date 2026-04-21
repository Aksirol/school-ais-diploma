import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  CalendarDays, 
  ClipboardCheck, 
  FileText, 
  Files, 
  MessageSquare, 
  BarChart3, 
  Users, 
  GraduationCap 
} from 'lucide-react';

// Загальний конфіг усіх можливих модулів системи
const ALL_MODULES = [
  {
    id: 'grades',
    title: 'Журнал оцінок',
    description: 'Виставлення, редагування оцінок, коментарі та перегляд успішності.',
    icon: BookOpen,
    path: '/grades',
    allowedRoles: ['teacher', 'student'],
  },
  {
    id: 'schedule',
    title: 'Розклад занять',
    description: 'Перегляд та управління розкладом уроків по класах та кабінетах.',
    icon: CalendarDays,
    path: '/schedule',
    allowedRoles: ['teacher', 'student'],
  },
  {
    id: 'attendance',
    title: 'Облік відвідуваності',
    description: 'Позначення присутності, причини пропусків та статистика.',
    icon: ClipboardCheck,
    path: '/attendance',
    allowedRoles: ['teacher', 'student'],
  },
  {
    id: 'homework',
    title: 'Домашні завдання',
    description: 'Публікація завдань, дедлайни, прикріплення файлів.',
    icon: FileText,
    path: '/homework',
    allowedRoles: ['teacher', 'student'],
  },
  {
    id: 'materials',
    title: 'Навчальні матеріали',
    description: 'Завантаження конспектів, презентацій, відео та посилань.',
    icon: Files,
    path: '/materials',
    allowedRoles: ['teacher', 'student'],
  },
  {
    id: 'messages',
    title: 'Повідомлення',
    description: 'Внутрішній месенджер для обміну повідомленнями.',
    icon: MessageSquare,
    path: '/messages',
    allowedRoles: ['teacher', 'student'],
  },
  {
    id: 'reports',
    title: 'Звіти та аналітика',
    description: 'Успішність класів, динаміка оцінок, зведені відомості.',
    icon: BarChart3,
    path: '/reports',
    allowedRoles: ['admin', 'teacher'],
  },
  {
    id: 'admin_users',
    title: 'Управління користувачами',
    description: 'Підтвердження реєстрацій, управління акаунтами та ролями.',
    icon: Users,
    path: '/admin/users',
    allowedRoles: ['admin'],
  },
  {
    id: 'admin_academic',
    title: 'Академічне управління',
    description: 'Налаштування класів, предметів та призначення педагогів.',
    icon: GraduationCap,
    path: '/admin/academic',
    allowedRoles: ['admin'],
  },
];

const Dashboard = () => {
  const { user } = useAuth();

  // Фільтруємо модулі: залишаємо лише ті, де роль користувача є в масиві allowedRoles
  const availableModules = ALL_MODULES.filter(module => 
    user?.role && module.allowedRoles.includes(user.role)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Вітаємо, {user?.first_name}!
        </h1>
        <p className="text-slate-600 mt-2">
          Оберіть потрібний модуль для початку роботи.
        </p>
      </div>

      {/* Модульна сітка */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableModules.map((module) => {
          const IconComponent = module.icon;
          
          return (
            <Link
              key={module.id}
              to={module.path}
              className="group bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 flex flex-col h-full"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-50 text-primary-600 p-3 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <IconComponent size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                  {module.title}
                </h3>
              </div>
              <p className="text-slate-600 text-sm flex-grow">
                {module.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;