import { useState, useEffect } from 'react';
import { Check, X, UserX } from 'lucide-react';
import api from '../../api/axios';

interface PendingUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'teacher' | 'student';
  created_at: string;
  Student?: {
    Class?: {
      name: string;
      year: number;
    };
  };
}

const UsersManagement = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Завантаження списку заявок
  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/admin/users/pending');
      setUsers(response.data);
    } catch (error) {
      console.error('Помилка завантаження заявок:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Підтвердження акаунту
  const handleApprove = async (id: number) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      // Видаляємо користувача зі списку на екрані
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      alert('Помилка підтвердження користувача');
    }
  };

  // Відхилення (видалення) акаунту
  const handleReject = async (id: number) => {
    if (!window.confirm('Ви впевнені, що хочете відхилити та видалити цю заявку?')) return;
    
    try {
      await api.delete(`/admin/users/${id}/reject`);
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      alert('Помилка відхилення користувача');
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'teacher' 
      ? <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-md text-xs font-bold">Педагог</span>
      : <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">Учень</span>;
  };

  if (isLoading) return <div className="text-center py-10">Завантаження...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-primary-50/50">
        <h2 className="text-xl font-bold text-slate-800">Заявки на реєстрацію</h2>
        <p className="text-slate-500 text-sm mt-1">
          Користувачі, які очікують вашого підтвердження для доступу до системи.
        </p>
      </div>

      {users.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <UserX size={40} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700">Немає нових заявок</h3>
          <p className="text-slate-500">Всі зареєстровані користувачі вже підтверджені.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Користувач</th>
                <th className="p-4 font-medium">Роль</th>
                <th className="p-4 font-medium">Клас (для учнів)</th>
                <th className="p-4 font-medium">Дата заявки</th>
                <th className="p-4 font-medium text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-slate-800">{user.last_name} {user.first_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {user.role === 'student' && user.Student?.Class 
                      ? `${user.Student.Class.year} / ${user.Student.Class.name}`
                      : '—'}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleApprove(user.id)}
                        className="bg-status-success/10 text-status-success hover:bg-status-success hover:text-white p-2 rounded-lg transition-colors"
                        title="Підтвердити"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleReject(user.id)}
                        className="bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white p-2 rounded-lg transition-colors"
                        title="Відхилити"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;