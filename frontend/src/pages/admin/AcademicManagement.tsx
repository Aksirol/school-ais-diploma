import { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Plus, Trash2, Edit2, Check, X, Layers } from 'lucide-react';
import api from '../../api/axios';

interface ClassData { id: number; name: string; year: number; }
interface SubjectData { id: number; name: string; }

const AcademicManagement = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стейт для створення
  const [newClass, setNewClass] = useState({ name: '', year: new Date().getFullYear() });
  const [newSubject, setNewSubject] = useState({ name: '' });

  // Стейт для редагування
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [editingSubject, setEditingSubject] = useState<SubjectData | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/subjects')
      ]);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- КЛАСИ ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/classes', newClass);
      setNewClass({ name: '', year: new Date().getFullYear() });
      fetchData();
    } catch (error) { alert('Помилка створення класу'); }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;
    try {
      await api.put(`/academic/classes/${editingClass.id}`, editingClass);
      setEditingClass(null);
      fetchData();
    } catch (error) { alert('Помилка оновлення класу'); }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Видалити цей клас? Це може вплинути на пов\'язаних учнів та розклад.')) return;
    try {
      await api.delete(`/academic/classes/${id}`);
      fetchData();
    } catch (error) { alert('Помилка видалення (можливо, клас не порожній)'); }
  };

  // --- ПРЕДМЕТИ ---
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/subjects', newSubject);
      setNewSubject({ name: '' });
      fetchData();
    } catch (error) { alert('Помилка створення предмета'); }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;
    try {
      await api.put(`/academic/subjects/${editingSubject.id}`, editingSubject);
      setEditingSubject(null);
      fetchData();
    } catch (error) { alert('Помилка оновлення предмета'); }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!window.confirm('Видалити цей предмет?')) return;
    try {
      await api.delete(`/academic/subjects/${id}`);
      fetchData();
    } catch (error) { alert('Помилка видалення'); }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-primary-400" /> Академічне управління
        </h2>
        <p className="text-slate-500">Налаштування класів та навчальних дисциплін гімназії</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* СЕКЦІЯ КЛАСІВ */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <GraduationCap className="text-accent-400" /> Класи
            </h3>
            <form onSubmit={handleCreateClass} className="flex gap-2 mb-6">
              <input 
                required placeholder="Назва (н-ад: 5-А)" 
                value={newClass.name}
                onChange={e => setNewClass({...newClass, name: e.target.value})}
                className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
              <button type="submit" className="bg-primary-400 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-2">
              {classes.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                  {editingClass?.id === c.id ? (
                    <div className="flex gap-2 w-full">
                      <input 
                        value={editingClass.name} 
                        onChange={e => setEditingClass({...editingClass, name: e.target.value})}
                        className="flex-1 p-1 border rounded text-sm outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <button onClick={handleUpdateClass} className="text-status-success"><Check size={18}/></button>
                      <button onClick={() => setEditingClass(null)} className="text-slate-400"><X size={18}/></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-slate-700">{c.name} клас</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingClass(c)} className="p-1.5 text-slate-400 hover:text-primary-500 rounded-md"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteClass(c.id)} className="p-1.5 text-slate-400 hover:text-status-danger rounded-md"><Trash2 size={14}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* СЕКЦІЯ ПРЕДМЕТІВ */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="text-primary-400" /> Навчальні предмети
            </h3>
            <form onSubmit={handleCreateSubject} className="flex gap-2 mb-6">
              <input 
                required placeholder="Назва предмета" 
                value={newSubject.name}
                onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
              <button type="submit" className="bg-primary-400 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                  {editingSubject?.id === s.id ? (
                    <div className="flex gap-2 w-full">
                      <input 
                        value={editingSubject.name} 
                        onChange={e => setEditingSubject({...editingSubject, name: e.target.value})}
                        className="flex-1 p-1 border rounded text-sm outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <button onClick={handleUpdateSubject} className="text-status-success"><Check size={18}/></button>
                      <button onClick={() => setEditingSubject(null)} className="text-slate-400"><X size={18}/></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-slate-700">{s.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingSubject(s)} className="p-1.5 text-slate-400 hover:text-primary-500 rounded-md"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteSubject(s.id)} className="p-1.5 text-slate-400 hover:text-status-danger rounded-md"><Trash2 size={14}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AcademicManagement;