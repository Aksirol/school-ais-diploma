import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface ClassItem {
  id: number;
  name: string;
  year: number;
}

interface Assignment {
  id: number;
  User: Teacher;
  Subject: Subject;
  Class: ClassItem;
}

const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Поля форми
  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    class_id: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resAssign, resSubjects, resClasses, resAllTeachers] = await Promise.all([
        api.get('/assignments'),
        api.get('/academic/subjects'),
        api.get('/academic/classes'),
        api.get('/admin/users/pending')
      ]);
      
      setAssignments(resAssign.data);
      setSubjects(resSubjects.data);
      setClasses(resClasses.data);
      setTeachers(resAllTeachers.data.filter((u: any) => u.role === 'teacher' || u.is_approved === true));
    } catch (error) {
      console.error('Помилка завантаження даних');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.subject_id || !formData.class_id) {
      alert('Заповніть всі поля');
      return;
    }

    try {
      await api.post('/assignments', {
        teacher_id: Number(formData.teacher_id),
        subject_id: Number(formData.subject_id),
        class_id: Number(formData.class_id)
      });
      setIsModalOpen(false);
      setFormData({ teacher_id: '', subject_id: '', class_id: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Помилка створення призначення');
    }
  };

  if (isLoading) return <div className="text-center py-20">Завантаження конфігурації...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Розподіл навантаження</h2>
          <p className="text-slate-500">Призначення педагогів на предмети у конкретних класах</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-400 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Створити призначення
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">Призначень поки немає. Натисніть кнопку "Створити", щоб почати.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-4 font-medium">Педагог</th>
                  <th className="p-4 font-medium">Предмет</th>
                  <th className="p-4 font-medium">Клас</th>
                  <th className="p-4 font-medium text-right">Дії</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((as) => (
                  <tr key={as.id} className="border-b border-slate-50 hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {as.User?.last_name[0]}{as.User?.first_name[0]}
                      </div>
                      <span className="font-medium text-slate-700">{as.User?.last_name} {as.User?.first_name}</span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="flex items-center gap-2">
                        <BookOpen size={16} className="text-accent-400" />
                        {as.Subject?.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-sm font-bold">
                        {as.Class?.name}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-slate-300 hover:text-status-danger transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h2 className="text-xl font-bold text-slate-800">Нове призначення</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-status-danger">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Педагог</label>
                <select 
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                >
                  <option value="">Оберіть вчителя</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.last_name} {t.first_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Предмет</label>
                <select 
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">Оберіть предмет</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Клас</label>
                <select 
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  value={formData.class_id}
                  onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                >
                  <option value="">Оберіть клас</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.year} / {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Скасувати
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-400 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsManagement;