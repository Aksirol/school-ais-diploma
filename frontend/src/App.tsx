import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Тимчасова заглушка для головної сторінки (Дашборду)
const Dashboard = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <h1 className="text-2xl font-bold text-slate-800">Головна панель</h1>
    <p className="text-slate-600 mt-2">Вітаємо в системі! Незабаром тут з'являться ваші модулі.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публічні маршрути */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Захищені маршрути */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              
              {/* Тут ми будемо додавати модулі: */}
              {/* <Route path="/materials" element={<Materials />} /> */}
              {/* <Route path="/grades" element={<Grades />} /> */}
              {/* <Route path="/messages" element={<Messages />} /> */}
              
              {/* Маршрути лише для адміна */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                {/* <Route path="/admin/users" element={<AdminUsers />} /> */}
              </Route>
            </Route>
          </Route>

          {/* 404 - Перенаправлення на головну */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;