import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- Імпорти сторінок ---
import Reports from './pages/admin/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Grades from './pages/Grades';
import Messages from './pages/Messages';
import Homework from './pages/Homework';
import Schedule from './pages/Schedule';
import Attendance from './pages/Attendance';
import Profile from './pages/Profile';

// --- Адмінські сторінки ---
import UsersManagement from './pages/admin/UsersManagement';
import AcademicManagement from './pages/admin/AcademicManagement';
import AssignmentsManagement from './pages/admin/AssignmentsManagement';

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
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Dashboard />} />
              
              {/* Готові освітні модулі */}
              <Route path="/materials" element={<Materials />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/homework" element={<Homework />} />

              {/* МАРШРУТИ АДМІНІСТРАТОРА (Тільки для ролі 'admin') */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/users" element={<UsersManagement />} />
                <Route path="/admin/academic" element={<AcademicManagement />} />
                <Route path="/admin/assignments" element={<AssignmentsManagement />} />
              </Route>

              {/* АНАЛІТИКА (Для Адміна та Вчителя) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
                <Route path="/reports" element={<Reports />} />
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