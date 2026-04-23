import { useState, useEffect, useMemo } from 'react';
import { Briefcase, Plus, Trash2, User as UserIcon, BookOpen, GraduationCap, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../api/axios';

interface AssignmentData {
  id: number;
  User: { first_name: string; last_name: string };
  Class: { name: string; year: number };
  Subject: { name: string };
}

type SortKey = 'teacher' | 'subject' | 'class';
type SortDirection = 'asc' | 'desc';

const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  const [formData, setFormData] = useState({ teacher_id: '', class_id: '', subject_id: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assignRes, usersRes, classesRes, subjectsRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/admin/users/active'),
        api.get('/academic/classes'),
        api.get('/academic/subjects')
      ]);

      setAssignments(assignRes.data);
      setTeachers(usersRes.data.filter((u: any) => u.role === 'teacher'));
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        teacher_id: Number(formData.teacher_id),
        class_id: Number(formData.class_id),
        subject_id: Number(formData.subject_id)
      });
      setFormData(prev => ({ ...prev, class_id: '', subject_id: '' }));
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Помилка при створенні призначення. Можливо, такий запис вже існує.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Зняти вчителя з цього предмета в даному класі? Це може вплинути на існуючі журнали.')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error) { alert('Помилка видалення призначення.'); }
  };

  // --- ЛОГІКА ФІЛЬТРАЦІЇ ТА СОРТУВАННЯ ---
  const processedAssignments = useMemo(() => {
    let result = [...assignments];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.User?.last_name.toLowerCase().includes(q) || 
        a.User?.first_name.toLowerCase().includes(q) ||
        a.Subject?.name.toLowerCase().includes(q) ||
        a.Class?.name.toLowerCase().includes(q)
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let valA = ''; let valB = '';
        if (sortConfig.key === 'teacher') {
          valA = a.User?.last_name.toLowerCase() || '';
          valB = b.User?.last_name.toLowerCase() || '';
        } else if (sortConfig.key === 'subject') {
          valA = a.Subject?.name.toLowerCase() || '';
          valB = b.Subject?.name.toLowerCase() || '';
        } else if (sortConfig.key === 'class') {
          valA = a.Class?.name.toLowerCase() || '';
          valB = b.Class?.name.toLowerCase() || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [assignments, searchQuery, sortConfig]);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-primary-500" /> : <ChevronDown size={14} className="text-primary-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Briefcase className="text-primary-400" /> Розподіл навантаження
        </h2>
        <p className="text-slate-500">Призначення педагогів на класи та навчальні предмети</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ФОРМА */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Нове призначення</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><UserIcon size={14} /> Педагог</label>
                <select required value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-slate-50">
                  <option value="">-- Оберіть вчителя --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.last_name} {t.first_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><BookOpen size={14} /> Предмет</label>
                <select required value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-slate-50">
                  <option value="">-- Оберіть предмет --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><GraduationCap size={14} /> Клас</label>
                <select required value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-slate-50">
                  <option value="">-- Оберіть клас --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-primary-400 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 mt-2">
                <Plus size={18} /> Призначити
              </button>
            </form>
          </div>
        </div>

        {/* ТАБЛИЦЯ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center gap-4 flex-wrap">
              <h3 className="font-bold text-slate-800">Поточний розподіл</h3>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Пошук..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">Завантаження...</div>
              ) : processedAssignments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl m-4">
                  Призначень не знайдено.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200 select-none">
                      <th onClick={() => handleSort('teacher')} className="p-4 font-bold cursor-pointer hover:bg-slate-50 group">
                        <div className="flex items-center gap-1">Педагог <SortIcon columnKey="teacher" /></div>
                      </th>
                      <th onClick={() => handleSort('subject')} className="p-4 font-bold cursor-pointer hover:bg-slate-50 group">
                        <div className="flex items-center gap-1">Предмет <SortIcon columnKey="subject" /></div>
                      </th>
                      <th onClick={() => handleSort('class')} className="p-4 font-bold text-center cursor-pointer hover:bg-slate-50 group">
                        <div className="flex items-center justify-center gap-1">Клас <SortIcon columnKey="class" /></div>
                      </th>
                      <th className="p-4 font-bold text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedAssignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">{assignment.User?.last_name} {assignment.User?.first_name}</td>
                        <td className="p-4 text-slate-600">{assignment.Subject?.name}</td>
                        <td className="p-4 text-center">
                          <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs font-bold">{assignment.Class?.name}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete(assignment.id)} className="p-1.5 text-slate-400 hover:text-status-danger hover:bg-status-danger/10 rounded-md transition-colors" title="Зняти з предмета">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsManagement;