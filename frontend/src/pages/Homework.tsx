import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, Plus, X, Edit2, Trash2, Upload, CheckCircle, XCircle, FileText, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import { saveAs } from 'file-saver';

// --- ІНТЕРФЕЙСИ ---
interface HomeworkItem {
  id: number;
  title: string;
  description: string;
  due_date: string;
  teacher_subject_id: number;
  TeacherSubject?: { Subject: { name: string }; Class: { name: string }; };
}

interface Submission {
  id: number;
  file_url: string | null;
  student_comment: string | null;
  teacher_comment: string | null;
  status: 'submitted' | 'accepted' | 'rejected';
  submitted_at: string;
  Student: { User: { first_name: string; last_name: string; middle_name?: string } };
}

const Homework = () => {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стейт для форми створення/редагування ДЗ (Вчитель)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '', teacher_subject_id: '' });

  // Стейт для Здачі ДЗ (Учень)
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedHwForSubmit, setSelectedHwForSubmit] = useState<number | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitComment, setSubmitComment] = useState('');

  // Стейт для Перевірки ДЗ (Вчитель)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);

  const fetchHomeworks = async () => {
    setIsLoading(true);
    try {
      const hwRes = await api.get('/homework');
      setHomeworks(Array.isArray(hwRes.data) ? hwRes.data : []);
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

  useEffect(() => { fetchHomeworks(); }, [user]);

  // --- ЛОГІКА СТВОРЕННЯ/РЕДАГУВАННЯ ДЗ (ВЧИТЕЛЬ) ---
  const handleEditClick = (hw: HomeworkItem) => {
    setFormData({ title: hw.title, description: hw.description, due_date: hw.due_date, teacher_subject_id: hw.teacher_subject_id.toString() });
    setEditId(hw.id);
    setIsModalOpen(true);
  };

  const handleDeleteHomework = async (id: number) => {
    if (!window.confirm('Видалити це завдання? Всі здані роботи учнів також будуть видалені.')) return;
    try {
      await api.delete(`/homework/${id}`);
      fetchHomeworks();
    } catch (error) { alert('Помилка видалення'); }
  };

  const handleSubmitHW = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/homework/${editId}`, formData);
      else await api.post('/homework', formData);
      
      setIsModalOpen(false);
      setFormData({ title: '', description: '', due_date: '', teacher_subject_id: '' });
      setEditId(null);
      fetchHomeworks();
    } catch (error) { alert('Помилка збереження завдання'); }
  };

  // --- ЛОГІКА ЗДАЧІ РОБОТИ (УЧЕНЬ) ---
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHwForSubmit) return;
    try {
      const data = new FormData();
      if (submitFile) data.append('file', submitFile);
      if (submitComment) data.append('student_comment', submitComment);

      await api.post(`/homework/${selectedHwForSubmit}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Роботу успішно надіслано на перевірку!');
      setSubmitModalOpen(false);
      setSubmitFile(null);
      setSubmitComment('');
    } catch (error: any) { alert(error.response?.data?.message || 'Помилка відправки роботи'); }
  };

  const handleDownload = async (fileUrl: string) => {
    try {
      const filename = fileUrl.split('/').pop();
      // Звертаємося до захищеного роуту, axios автоматично додасть JWT
      const res = await api.get(`/files/${filename}`, { responseType: 'blob' });
      saveAs(res.data, filename || 'document');
    } catch (error) {
      alert('Помилка завантаження. Файл недоступний або у вас немає прав.');
    }
  };

  // --- ЛОГІКА ПЕРЕВІРКИ РОБІТ (ВЧИТЕЛЬ) ---
  const openReviewModal = async (hwId: number) => {
    setReviewModalOpen(true);
    setIsSubmissionsLoading(true);
    try {
      const res = await api.get(`/homework/${hwId}/submissions`);
      setSubmissions(res.data);
    } catch (error) {
      alert('Помилка завантаження робіт учнів');
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  const updateSubmissionStatus = async (subId: number, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/homework/submissions/${subId}/review`, { status });
      // Оновлюємо статус локально, щоб не робити зайвий запит
      setSubmissions(submissions.map(s => s.id === subId ? { ...s, status } : s));
    } catch (error) { alert('Помилка оновлення статусу'); }
  };

  const isOverdue = (dateString: string) => new Date(dateString) < new Date();

  if (isLoading) return <div className="p-8 text-center text-slate-500">Завантаження завдань...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Домашні завдання</h2>
          <p className="text-slate-500">{user?.role === 'teacher' ? 'Управління завданнями та перевірка робіт' : 'Ваші поточні завдання'}</p>
        </div>
        {user?.role === 'teacher' && (
          <button 
            onClick={() => { setEditId(null); setFormData({ title: '', description: '', due_date: '', teacher_subject_id: '' }); setIsModalOpen(true); }}
            className="bg-primary-400 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Створити завдання
          </button>
        )}
      </div>

      {/* GRID ЗАВДАНЬ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homeworks.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            Завдань поки немає.
          </div>
        ) : (
          homeworks.map(hw => (
            <div key={hw.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full hover:border-primary-300 transition-colors relative group">
              
              {user?.role !== 'student' && (
                <div className="absolute top-3 right-3 hidden group-hover:flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100 z-10">
                  <button onClick={() => handleEditClick(hw)} className="p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-500 rounded-md transition-colors" title="Редагувати"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteHomework(hw.id)} className="p-1.5 text-slate-400 hover:bg-status-danger/10 hover:text-status-danger rounded-md transition-colors" title="Видалити"><Trash2 size={16} /></button>
                </div>
              )}

              <div className="flex justify-between items-start mb-3 pr-16">
                <span className="bg-primary-50 text-primary-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                  <BookOpen size={12} /> {hw.TeacherSubject?.Subject?.name || 'Предмет'}
                </span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {hw.TeacherSubject?.Class?.name || 'Клас'}
                </span>
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 mb-2">{hw.title}</h3>
              <p className="text-slate-600 text-sm flex-grow mb-4">{hw.description}</p>
              
              <div className={`flex justify-between items-center text-sm pt-4 border-t border-slate-100 font-medium ${isOverdue(hw.due_date) ? 'text-status-danger' : 'text-slate-500'}`}>
                <div className="flex items-center gap-1"><Calendar size={16} /> {new Date(hw.due_date).toLocaleDateString('uk-UA')}</div>
              </div>

              {/* КНОПКИ ДІЙ (Здати / Перевірити) */}
              <div className="mt-4 pt-3 border-t border-slate-50">
                {user?.role === 'student' ? (
                  <button 
                    onClick={() => { setSelectedHwForSubmit(hw.id); setSubmitModalOpen(true); }}
                    className="w-full py-2 bg-primary-50 text-primary-600 hover:bg-primary-400 hover:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload size={18} /> Здати роботу
                  </button>
                ) : (
                  <button 
                    onClick={() => openReviewModal(hw.id)}
                    className="w-full py-2 border border-primary-200 text-primary-600 hover:bg-primary-50 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={18} /> Переглянути роботи
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* МОДАЛКА: СТВОРЕННЯ/РЕДАГУВАННЯ (ВЧИТЕЛЬ) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h2 className="font-bold text-slate-800">{editId ? 'Редагувати завдання' : 'Нове завдання'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-status-danger"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitHW} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Предмет та Клас</label>
                <select required value={formData.teacher_subject_id} onChange={e => setFormData({...formData, teacher_subject_id: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                  <option value="">Оберіть...</option>
                  {assignments.map(a => <option key={a.id} value={a.id}>{a.Class?.name} — {a.Subject?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Тема завдання</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Опис / Що зробити</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Дедлайн</label>
                <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <button type="submit" className="w-full py-2 bg-primary-400 text-white rounded-lg font-bold hover:bg-primary-600 transition-colors mt-4">
                {editId ? 'Зберегти зміни' : 'Опублікувати'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ЗДАЧА РОБОТИ (УЧЕНЬ) */}
      {submitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Upload size={20} className="text-primary-500"/> Здача роботи</h2>
              <button onClick={() => setSubmitModalOpen(false)} className="text-slate-400 hover:text-status-danger"><X size={24} /></button>
            </div>
            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4">
              <div className="border-2 border-dashed border-primary-200 bg-primary-50 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                <input 
                  type="file" 
                  onChange={(e) => setSubmitFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 cursor-pointer"
                />
                {!submitFile && <p className="text-xs text-slate-500 mt-2">Прикріпіть фото зошита або документ</p>}
              </div>
              <div>
                <label className="flex text-sm font-medium text-slate-700 mb-1 items-center gap-1"><MessageSquare size={16}/> Коментар вчителю</label>
                <textarea rows={2} value={submitComment} onChange={e => setSubmitComment(e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400 resize-none border-slate-200" placeholder="Напишіть щось (опціонально)..." />
              </div>
              <button type="submit" className="w-full py-2 bg-primary-400 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors">
                Відправити на перевірку
              </button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ПЕРЕВІРКА РОБІТ (ВЧИТЕЛЬ) */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50 shrink-0">
              <h2 className="font-bold text-slate-800">Здані роботи учнів</h2>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-status-danger"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {isSubmissionsLoading ? (
                <div className="text-center text-slate-500 py-10">Завантаження робіт...</div>
              ) : submissions.length === 0 ? (
                <div className="text-center text-slate-500 py-10 border border-dashed border-slate-300 rounded-xl bg-white">
                  Жоден учень ще не здав роботу.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map(sub => (
                    <div key={sub.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-bold text-slate-800">{sub.Student.User.last_name} {sub.Student.User.first_name} {sub.Student.User.middle_name?.[0]}.</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Здано: {new Date(sub.submitted_at).toLocaleString('uk-UA')}</p>
                        </div>
                        {/* Статус бейдж */}
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sub.status === 'accepted' ? 'bg-status-success/10 text-status-success' : sub.status === 'rejected' ? 'bg-status-danger/10 text-status-danger' : 'bg-status-warning/10 text-status-warning'}`}>
                          {sub.status === 'accepted' ? 'Прийнято' : sub.status === 'rejected' ? 'Відхилено' : 'Очікує'}
                        </span>
                      </div>
                      
                      {sub.student_comment && (
                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">"{sub.student_comment}"</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 pt-2">
                        {sub.file_url ? (
                          <button onClick={() => sub.file_url && handleDownload(sub.file_url)} className="flex items-center gap-1 text-primary-500 hover:text-primary-700 text-sm font-medium">
                            <FileText size={16} /> Відкрити файл
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">Файл не прикріплено</span>
                        )}

                        {/* Кнопки оцінювання */}
                        <div className="flex gap-2">
                          <button onClick={() => updateSubmissionStatus(sub.id, 'accepted')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${sub.status === 'accepted' ? 'bg-status-success text-white shadow-sm' : 'bg-status-success/10 text-status-success hover:bg-status-success hover:text-white'}`}>
                            <CheckCircle size={16} /> Прийняти
                          </button>
                          <button onClick={() => updateSubmissionStatus(sub.id, 'rejected')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${sub.status === 'rejected' ? 'bg-status-danger text-white shadow-sm' : 'bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white'}`}>
                            <XCircle size={16} /> Повернути
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Homework;