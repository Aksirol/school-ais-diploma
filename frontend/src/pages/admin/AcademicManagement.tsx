import { useState, useEffect } from 'react';
import { School, Plus, Library } from 'lucide-react';
import api from '../../api/axios';

interface ClassItem {
  id: number;
  name: string;
  year: number;
}

const AcademicManagement = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [currentYear] = useState(new Date().getFullYear());

  const fetchClasses = async () => {
    try {
      const response = await api.get('/academic/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Помилка завантаження класів');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await api.post('/academic/classes', { name: newClassName, year: currentYear });
      setNewClassName('');
      fetchClasses();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Помилка створення класу');
    }
  };

  // Функція для швидкого наповнення гімназії (5-9 класи)
  const handleQuickSetup = async () => {
    const letters = ['А', 'Б'];
    const grades = [5, 6, 7, 8, 9];
    
    try {
      for (const grade of grades) {
        for (const letter of letters) {
          const name = `${grade}-${letter}`;
          // Перевіряємо, чи такого класу ще немає в списку
          if (!classes.find(c => c.name === name)) {
            await api.post('/academic/classes', { name, year: currentYear });
          }
        }
      }
      fetchClasses();
      alert('Структуру гімназії (5-9 класи А та Б) успішно створено!');
    } catch (error) {
      alert('Сталася помилка при масовому створенні');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Академічне управління</h2>
          <p className="text-slate-500">Налаштування класів та навчальних предметів</p>
        </div>
        <button 
          onClick={handleQuickSetup}
          className="bg-accent-400 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <School size={18} />
          Швидке налаштування (5-9 класи)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Секція класів */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-primary-600">
            <Library size={20} />
            <h3 className="font-bold text-lg">Класи гімназії</h3>
          </div>

          <form onSubmit={handleAddClass} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Напр: 5-В"
              className="flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-400"
            />
            <button type="submit" className="bg-primary-400 text-white p-2 rounded-lg hover:bg-primary-600 transition-colors">
              <Plus size={24} />
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {classes.map((cls) => (
              <div key={cls.id} className="flex justify-between items-center p-3 bg-primary-50 rounded-lg border border-primary-100 group">
                <span className="font-bold text-primary-700">{cls.name}</span>
                <span className="text-xs text-primary-300">{cls.year}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Тут згодом буде секція предметів */}
        <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex items-center justify-center">
          <p className="text-slate-400 italic">Секція предметів буде додана пізніше</p>
        </div>
      </div>
    </div>
  );
};

export default AcademicManagement;