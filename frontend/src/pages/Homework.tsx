import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, Plus, X} from 'lucide-react';
import api from '../api/axios';

interface HomeworkItem {
  id: number;
  title: string;
  description: string;
  due_date: string;
  teacher_subject_id: number;
  TeacherSubject?: {
    Subject: { name: string };
    Class: { name: string };
  };
}

const Homework = () => {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Форма
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '', teacher_subject_id: '' });

  // Тимчасові демо-дані, поки бекенд для ДЗ не готовий
  const fetchHomeworks = async () => {
    setIsLoading(true);
    try {
      // Отримуємо реальні домашні завдання
      const hwRes = await api.get('/homework');
      setHomeworks(hwRes.data);
      
      // Якщо вчитель, отримуємо його призначення для селекту у формі
      if (user?.role === 'teacher') {
        const res = await api.get('/assignments');
        setAssignments(res.data);
      }
    } catch (error) {
      console.error('Помилка завантаження ДЗ:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/homework', formData);
      setIsModalOpen(false);
      setFormData({ title: '', description: '', due_date: '', teacher_subject_id: '' });
      fetchHomeworks(); // Оновлюємо список після створення
    } catch (error) {
      alert('Помилка створення завдання. Перевірте дані.');
    }
  };

  const isOverdue = (dateString: string) => new Date(dateString) < new Date();

  if (isLoading) return <div className="p-8 text-center text-slate-500">Завантаження завдань...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Домашні завдання</h2>
          <p className="text-slate-500">{user?.role === 'teacher' ? 'Управління завданнями для ваших класів' : 'Ваші поточні завдання'}</p>
        </div>
        {user?.role === 'teacher' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-400 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Створити завдання
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homeworks.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            Завдань поки немає.
          </div>
        ) : (
          homeworks.map(hw => (
            <div key={hw.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full hover:border-primary-300 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-primary-50 text-primary-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                  <BookOpen size={12} />
                  {hw.TeacherSubject?.Subject.name}
                </span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {hw.TeacherSubject?.Class.name}
                </span>
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 mb-2">{hw.title}</h3>
              <p className="text-slate-600 text-sm flex-grow mb-4">{hw.description}</p>
              
              <div className={`flex items-center gap-2 text-sm pt-4 border-t border-slate-100 font-medium ${isOverdue(hw.due_date) ? 'text-status-danger' : 'text-slate-500'}`}>
                <Calendar size={16} />
                Термін: {new Date(hw.due_date).toLocaleDateString('uk-UA')}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h2 className="font-bold text-slate-800">Нове завдання</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-status-danger"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Предмет та Клас</label>
                <select required onChange={e => setFormData({...formData, teacher_subject_id: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400">
                  <option value="">Оберіть...</option>
                  {assignments.map(a => <option key={a.id} value={a.id}>{a.Class.name} — {a.Subject.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Тема завдання</label>
                <input required type="text" onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Опис / Що зробити</label>
                <textarea required rows={3} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Дедлайн</label>
                <input required type="date" onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <button type="submit" className="w-full py-2 bg-primary-400 text-white rounded-lg font-bold hover:bg-primary-600 transition-colors mt-4">Опублікувати</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homework;