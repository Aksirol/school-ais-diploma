import { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Trash2, Users, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_approved: boolean;
}

type SortKey = 'last_name' | 'email' | 'role';
type SortDirection = 'asc' | 'desc';

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стейти для пошуку та фільтрації
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Стейт для сортування
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/admin/users/pending' : '/admin/users/active';
      const res = await api.get(endpoint);
      setUsers(res.data);
    } catch (error) {
      console.error('Помилка завантаження користувачів:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Скидаємо фільтри при перемиканні вкладок
    setSearchQuery('');
    setRoleFilter('all');
    setSortConfig(null);
  }, [activeTab]);

  // --- ЛОГІКА ФІЛЬТРАЦІЇ ТА СОРТУВАННЯ (useMemo для продуктивності) ---
  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Пошук (за ПІБ або Email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.first_name.toLowerCase().includes(query) ||
        u.last_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // 2. Фільтрація за роллю
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // 3. Сортування
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key].toLowerCase();
        const valB = b[sortConfig.key].toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, searchQuery, roleFilter, sortConfig]);

  // --- ФУНКЦІЇ ДЛЯ КЛІКІВ ---
  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) { alert('Помилка при підтвердженні'); }
  };

  const handleDelete = async (id: number, isPending: boolean) => {
    if (!window.confirm(isPending ? 'Відхилити запит?' : 'Назавжди видалити користувача?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) { alert('Помилка при видаленні.'); }
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    if (!window.confirm('Змінити роль цього користувача?')) return;
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (error) { alert('Помилка зміни ролі'); }
  };

  // Компонент для іконки сортування
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-primary-500" /> : <ChevronDown size={14} className="text-primary-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-primary-400" /> Управління користувачами
          </h2>
          <p className="text-slate-500">Затвердження реєстрацій та управління ролями</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-lg">
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'pending' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Нові запити <span className="ml-1 bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full text-xs">{activeTab === 'pending' ? users.length : ''}</span>
          </button>
          <button onClick={() => setActiveTab('active')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'active' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Всі користувачі
          </button>
        </div>
      </div>

      {/* ПАНЕЛЬ ПОШУКУ ТА ФІЛЬТРАЦІЇ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Пошук за ПІБ або Email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
          >
            <option value="all">Усі ролі</option>
            <option value="student">Учні</option>
            <option value="teacher">Педагоги</option>
            <option value="admin">Адміністратори</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Завантаження...</div>
        ) : processedUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-300 m-4 rounded-xl">
            {searchQuery || roleFilter !== 'all' ? 'За вашими фільтрами нічого не знайдено.' : 'Список порожній.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider select-none">
                  <th onClick={() => handleSort('last_name')} className="p-4 font-bold cursor-pointer hover:bg-slate-100 group transition-colors">
                    <div className="flex items-center gap-1">ПІБ <SortIcon columnKey="last_name" /></div>
                  </th>
                  <th onClick={() => handleSort('email')} className="p-4 font-bold cursor-pointer hover:bg-slate-100 group transition-colors">
                    <div className="flex items-center gap-1">Електронна пошта <SortIcon columnKey="email" /></div>
                  </th>
                  <th onClick={() => handleSort('role')} className="p-4 font-bold cursor-pointer hover:bg-slate-100 group transition-colors">
                    <div className="flex items-center gap-1">Роль <SortIcon columnKey="role" /></div>
                  </th>
                  <th className="p-4 font-bold text-right">Дії</th>
                </tr>
              </thead>
              <tbody>
                {processedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">
                      {u.last_name} {u.first_name}
                      {u.id === currentUser?.id && <span className="ml-2 text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded font-bold uppercase">Ви</span>}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{u.email}</td>
                    <td className="p-4">
                      {activeTab === 'active' && u.id !== currentUser?.id ? (
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-white border border-slate-200 text-sm rounded px-2 py-1 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm"
                        >
                          <option value="student">Учень</option>
                          <option value="teacher">Вчитель</option>
                          <option value="admin">Адмін</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'teacher' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role === 'admin' ? 'Адмін' : u.role === 'teacher' ? 'Вчитель' : 'Учень'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      {activeTab === 'pending' ? (
                        <>
                          <button onClick={() => handleApprove(u.id)} className="p-2 bg-status-success/10 text-status-success hover:bg-status-success hover:text-white rounded-lg transition-colors" title="Підтвердити"><CheckCircle size={18} /></button>
                          <button onClick={() => handleDelete(u.id, true)} className="p-2 bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white rounded-lg transition-colors" title="Відхилити"><XCircle size={18} /></button>
                        </>
                      ) : (
                        u.id !== currentUser?.id && (
                          <button onClick={() => handleDelete(u.id, false)} className="p-2 text-slate-400 hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors" title="Видалити">
                            <Trash2 size={18} />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;