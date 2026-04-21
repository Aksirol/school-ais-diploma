import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, Calendar as CalendarIcon, UserX, UserCheck, Clock, Save } from 'lucide-react';
import api from '../api/axios';

const Attendance = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Тимчасові демо-дані для списку учнів
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent' | 'late'>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'teacher') {
      api.get('/assignments').then(res => setAssignments(res.data)).catch(console.error);
    }
  }, [user]);

  // Завантажуємо учнів, коли вчитель обирає клас
  useEffect(() => {
    if (selectedAssignment) {
      setIsLoading(true);
      setTimeout(() => {
        const demoStudents = [
          { id: 1, first_name: 'Іван', last_name: 'Шевченко' },
          { id: 2, first_name: 'Олена', last_name: 'Коваленко' },
          { id: 3, first_name: 'Андрій', last_name: 'Бойко' },
          { id: 4, first_name: 'Марія', last_name: 'Петренко' },
        ];
        setStudents(demoStudents);
        
        // За замовчуванням всі присутні
        const initialAttendance: any = {};
        demoStudents.forEach(s => initialAttendance[s.id] = 'present');
        setAttendance(initialAttendance);
        
        setIsLoading(false);
      }, 400);
    } else {
      setStudents([]);
    }
  }, [selectedAssignment]);

  const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    try {
      await api.post('/attendance', {
        date,
        teacher_subject_id: Number(selectedAssignment),
        records: attendance
      });
      alert('Журнал успішно збережено!');
    } catch (error) {
      alert('Помилка збереження');
    }
  };

  if (user?.role === 'student') {
    return (
      <div className="bg-white p-10 rounded-xl shadow-sm text-center border border-slate-200">
        <ClipboardCheck size={48} className="mx-auto text-primary-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Ваша відвідуваність</h2>
        <p className="text-slate-500 mt-2">Тут буде відображатись статистика ваших пропусків.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="text-accent-400" />
            Відвідуваність
          </h2>
          <p className="text-slate-500">Відмітьте відсутніх на вашому уроці</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={students.length === 0}
          className="bg-accent-400 hover:bg-accent-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Save size={20} />
          Зберегти журнал
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-slate-400" size={20} />
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-slate-50 font-medium"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <select 
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-slate-50"
          >
            <option value="">-- Оберіть клас та предмет --</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>{a.Class.name} — {a.Subject.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedAssignment ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
          Будь ласка, оберіть предмет та клас для заповнення журналу відвідуваності.
        </div>
      ) : isLoading ? (
        <div className="text-center p-12 bg-white rounded-xl text-slate-500">Завантаження списку класу...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium w-16 text-center">№</th>
                <th className="p-4 font-medium">Прізвище та ім'я</th>
                <th className="p-4 font-medium text-center">Статус присутності</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-center text-slate-400">{index + 1}</td>
                  <td className="p-4 font-medium text-slate-800">
                    {student.last_name} {student.first_name}
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1">
                      <button
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${attendance[student.id] === 'present' ? 'bg-white text-status-success shadow-sm border border-slate-200' : 'text-slate-400 hover:text-status-success'}`}
                      >
                        <UserCheck size={16} /> Присутній
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${attendance[student.id] === 'absent' ? 'bg-white text-status-danger shadow-sm border border-slate-200' : 'text-slate-400 hover:text-status-danger'}`}
                      >
                        <UserX size={16} /> Відсутній
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'late')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${attendance[student.id] === 'late' ? 'bg-white text-status-warning shadow-sm border border-slate-200' : 'text-slate-400 hover:text-status-warning'}`}
                      >
                        <Clock size={16} /> Запізнення
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

export default Attendance;