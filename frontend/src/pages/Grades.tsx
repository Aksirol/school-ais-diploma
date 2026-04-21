import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, User as UserIcon } from 'lucide-react';

interface GradeRecord {
  id: number;
  value: number;
  grade_date: string;
  comment?: string;
}

interface JournalEntry {
  id: number;
  User: { id: number; first_name: string; last_name: string };
  Grades: GradeRecord[];
}

interface Assignment {
  id: number;
  Class: { name: string; year: number };
  Subject: { name: string };
}

const Grades = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [setIsLoading] = useState(false);

  // Для модального вікна додавання оцінки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<{id: number, name: string} | null>(null);
  const [newGrade, setNewGrade] = useState({ value: 10, date: new Date().toISOString().split('T')[0], comment: '' });

  useEffect(() => {
    if (user?.role === 'teacher') {
      api.get('/assignments').then(res => setAssignments(res.data));
    } else if (user?.role === 'student') {
      // Для учня логіка простіша — він бачить свої оцінки (можна реалізувати окремим видом)
      fetchStudentGrades();
    }
  }, [user]);

  const fetchJournal = async (id: number) => {
    try {
      const res = await api.get(`/grades/journal/${id}`);
      setJournal(res.data);
      setSelectedAssignment(id);
    } catch (error) {
      console.error(error);
    } finally {
    }
  };

  const fetchStudentGrades = async () => {
    await api.get('/grades');
    // ... групування по предметах ...
  };

  const handleAddGrade = async () => {
    try {
      await api.post('/grades', {
        student_id: activeStudent?.id,
        teacher_subject_id: selectedAssignment,
        grade_date: newGrade.date,
        value: newGrade.value,
        comment: newGrade.comment
      });
      setIsModalOpen(false);
      fetchJournal(selectedAssignment!); // Оновлюємо таблицю
    } catch (error) {
      alert('Помилка виставлення оцінки');
    }
  };

  const calculateAverage = (grades: GradeRecord[]) => {
    if (!grades || grades.length === 0) return '-';
    const sum = grades.reduce((acc, curr) => acc + curr.value, 0);
    return (sum / grades.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* СЕЛЕКТ ПРЕДМЕТА (Тільки для вчителя) */}
      {user?.role === 'teacher' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3">
          {assignments.map(as => (
            <button
              key={as.id}
              onClick={() => fetchJournal(as.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedAssignment === as.id ? 'bg-primary-400 text-white shadow-md' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'}`}
            >
              {as.Class.name} — {as.Subject.name}
            </button>
          ))}
        </div>
      )}

      {/* ТАБЛИЦЯ ЖУРНАЛУ */}
      {selectedAssignment && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-4 font-medium w-64">Прізвище та ім'я учня</th>
                  <th className="p-4 font-medium">Останні оцінки</th>
                  <th className="p-4 font-medium text-center w-24">Сер. бал</th>
                  <th className="p-4 font-medium text-right w-20">Дії</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <UserIcon size={16} />
                      </div>
                      <span className="font-medium text-slate-700">{entry.User.last_name} {entry.User.first_name}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {entry.Grades.map(g => (
                          <div key={g.id} className="group relative">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold border ${g.value >= 10 ? 'bg-accent-50 text-accent-400 border-accent-400' : 'bg-primary-50 text-primary-400 border-primary-200'}`}>
                              {g.value}
                            </span>
                            {/* Тултіп з датою */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                              {g.grade_date}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${Number(calculateAverage(entry.Grades)) >= 10 ? 'text-accent-400' : 'text-slate-600'}`}>
                        {calculateAverage(entry.Grades)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => {
                          setActiveStudent({id: entry.id, name: `${entry.User.last_name} ${entry.User.first_name}`});
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-primary-400 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО ДОДАВАННЯ ОЦІНКИ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-primary-100">
            <div className="p-6 border-b border-slate-100 bg-primary-50">
              <h2 className="font-bold text-slate-800">Виставити оцінку</h2>
              <p className="text-sm text-primary-600">{activeStudent?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Бал (1-12)</label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <button
                      key={num}
                      onClick={() => setNewGrade({...newGrade, value: num})}
                      className={`h-10 rounded-lg border font-bold transition-all ${newGrade.value === num ? 'bg-primary-400 border-primary-400 text-white scale-110 shadow-md' : 'border-slate-200 text-slate-600 hover:border-primary-200'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Дата</label>
                <input 
                  type="date" 
                  value={newGrade.date}
                  onChange={(e) => setNewGrade({...newGrade, date: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-500 font-medium">Скасувати</button>
                <button onClick={handleAddGrade} className="flex-1 py-2 bg-primary-400 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-600 transition-all">Зберегти</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;