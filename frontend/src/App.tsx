import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- Імпорти сторінок ---
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Grades from './pages/Grades';
import Messages from './pages/Messages';

// --- Адмінські сторінки ---
import UsersManagement from './pages/admin/UsersManagement';
import AcademicManagement from './pages/admin/AcademicManagement';
import AssignmentsManagement from './pages/admin/AssignmentsManagement';

// Компонент-заглушка для нереалізованих модулів
const Placeholder = ({ title }: { title: string }) => (
  <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
    <div className="w-16 h-16 bg-primary-50 text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
      🛠️
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-slate-500 max-w-md mx-auto">
      Цей модуль наразі знаходиться на стадії розробки. Незабаром тут з'явиться новий функціонал.
    </p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ПУБЛІЧНІ МАРШРУТИ */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ЗАХИЩЕНІ МАРШРУТИ (Для всіх авторизованих) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              
              {/* Готові освітні модулі */}
              <Route path="/materials" element={<Materials />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/messages" element={<Messages />} />

              {/* Модулі-заглушки (щоб картки на Дашборді працювали) */}
              <Route path="/schedule" element={<Placeholder title="Розклад занять" />} />
              <Route path="/attendance" element={<Placeholder title="Облік відвідуваності" />} />
              <Route path="/homework" element={<Placeholder title="Домашні завдання" />} />

              {/* МАРШРУТИ АДМІНІСТРАТОРА (Тільки для ролі 'admin') */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/users" element={<UsersManagement />} />
                <Route path="/admin/academic" element={<AcademicManagement />} />
                <Route path="/admin/assignments" element={<AssignmentsManagement />} />
                <Route path="/reports" element={<Placeholder title="Звіти та аналітика" />} />
              </Route>
            </Route>
          </Route>

          {/* 404 - Перенаправлення на головну, якщо роут не знайдено */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;