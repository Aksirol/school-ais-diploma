import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Search, FileSpreadsheet, BookOpen, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface GradeRecord { id: number; value: number; grade_date: string; comment?: string; }
interface JournalEntry { id: number; User: { id: number; first_name: string; last_name: string; middle_name?: string }; Grades: GradeRecord[]; }
interface Assignment { id: number; Class: { name: string; year: number }; Subject: { name: string }; }

type SortKey = 'name' | 'average' | 'subject';
type SortDirection = 'asc' | 'desc';

const Grades = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<{id: number, name: string} | null>(null);
  const [newGrade, setNewGrade] = useState({ value: 10, date: new Date().toISOString().split('T')[0], comment: '' });
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  
  const [studentGrades, setStudentGrades] = useState<{subject: string, grades: GradeRecord[]}[]>([]);

  useEffect(() => {
    if (user?.role === 'teacher') {
      api.get('/assignments').then(res => setAssignments(res.data));
    } else if (user?.role === 'student') {
      fetchStudentGrades();
    }
  }, [user]);

  const fetchJournal = async (id: number) => {
    try {
      const res = await api.get(`/grades/journal/${id}`);
      setJournal(res.data);
      setSelectedAssignment(id);
    } catch (error) { console.error(error); }
  };

  const fetchStudentGrades = async () => {
    try {
      const res = await api.get('/grades');
      const grouped: Record<string, GradeRecord[]> = {};
      res.data.forEach((grade: any) => {
        const subjName = grade.TeacherSubject?.Subject?.name || 'Предмет';
        if (!grouped[subjName]) grouped[subjName] = [];
        grouped[subjName].push(grade);
      });
      setStudentGrades(Object.entries(grouped).map(([subject, grades]) => ({ subject, grades })));
    } catch (error) { console.error(error); }
  };

  const handleSaveGrade = async () => {
    try {
      if (editingGradeId) {
        await api.put(`/grades/${editingGradeId}`, { value: newGrade.value, grade_date: newGrade.date, comment: newGrade.comment });
      } else {
        await api.post('/grades', { student_id: activeStudent?.id, teacher_subject_id: selectedAssignment, grade_date: newGrade.date, value: newGrade.value, comment: newGrade.comment });
      }
      setIsModalOpen(false);
      fetchJournal(selectedAssignment!);
    } catch (error) { alert('Помилка збереження оцінки'); }
  };

  const handleDeleteGrade = async () => {
    if (!window.confirm('Видалити цю оцінку?')) return;
    try {
      await api.delete(`/grades/${editingGradeId}`);
      setIsModalOpen(false);
      fetchJournal(selectedAssignment!);
    } catch (error) { alert('Помилка видалення оцінки'); }
  };

  const calculateAverage = (grades: GradeRecord[]) => {
    if (!grades || grades.length === 0) return '-';
    const sum = grades.reduce((acc, curr) => acc + curr.value, 0);
    return (sum / grades.length).toFixed(1);
  };

  const exportToExcel = () => {
    if (!journal.length || !selectedAssignment) return;
    const currentAssignment = assignments.find(a => a.id === selectedAssignment);
    const fileName = `Journal_${currentAssignment?.Class.name}_${currentAssignment?.Subject.name}_${new Date().toLocaleDateString('uk-UA')}.xlsx`;
    const dataToExport = journal.map((entry, index) => ({
      '№': index + 1,
      'Учень': `${entry.User.last_name} ${entry.User.first_name} ${entry.User.middle_name || ''}`.trim(),
      'Оцінки': entry.Grades.map(g => g.value).join(', '),
      'Середній бал': calculateAverage(entry.Grades)
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Журнал");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, fileName);
  };

  // --- ЛОГІКА ФІЛЬТРАЦІЇ ТА СОРТУВАННЯ ---
  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-primary-500" /> : <ChevronDown size={14} className="text-primary-500" />;
  };

  const processedJournal = useMemo(() => {
    let result = [...journal];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.User.first_name.toLowerCase().includes(q) || e.User.last_name.toLowerCase().includes(q));
    }
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'name') {
          const valA = a.User.last_name.toLowerCase();
          const valB = b.User.last_name.toLowerCase();
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        } else if (sortConfig.key === 'average') {
          const valA = Number(calculateAverage(a.Grades)) || 0;
          const valB = Number(calculateAverage(b.Grades)) || 0;
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return result;
  }, [journal, searchQuery, sortConfig]);

  const processedStudentGrades = useMemo(() => {
    let result = [...studentGrades];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(sg => sg.subject.toLowerCase().includes(q));
    }
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'subject') {
          if (a.subject < b.subject) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a.subject > b.subject) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        } else if (sortConfig.key === 'average') {
          const valA = Number(calculateAverage(a.grades)) || 0;
          const valB = Number(calculateAverage(b.grades)) || 0;
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return result;
  }, [studentGrades, searchQuery, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Електронний журнал</h2>
          <p className="text-slate-500">Облік успішності та формування звітності</p>
        </div>
        {selectedAssignment && user?.role === 'teacher' && (
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-emerald-100">
            <FileSpreadsheet size={20} /> Експорт в Excel
          </button>
        )}
      </div>

      {user?.role === 'teacher' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3">
          {assignments.map(as => (
            <button key={as.id} onClick={() => { fetchJournal(as.id); setSortConfig(null); setSearchQuery(''); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedAssignment === as.id ? 'bg-primary-400 text-white shadow-md' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'}`}>
              {as.Class.name} — {as.Subject.name}
            </button>
          ))}
        </div>
      )}

      {(selectedAssignment || (user?.role === 'student' && studentGrades.length > 0)) && (
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder={user?.role === 'teacher' ? "Пошук учня..." : "Пошук предмета..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-white shadow-sm" />
        </div>
      )}

      {/* ЖУРНАЛ (ВЧИТЕЛЬ) */}
      {selectedAssignment && user?.role === 'teacher' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200 select-none">
                <th onClick={() => handleSort('name')} className="p-4 font-medium w-64 cursor-pointer hover:bg-slate-100 group">
                  <div className="flex items-center gap-1">Учень <SortIcon columnKey="name" /></div>
                </th>
                <th className="p-4 font-medium">Оцінки</th>
                <th onClick={() => handleSort('average')} className="p-4 font-medium text-center w-32 cursor-pointer hover:bg-slate-100 group">
                  <div className="flex items-center justify-center gap-1">Сер. бал <SortIcon columnKey="average" /></div>
                </th>
                <th className="p-4 font-medium text-right w-20">Дії</th>
              </tr>
            </thead>
            <tbody>
              {processedJournal.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">За вашим запитом учнів не знайдено.</td></tr>
              ) : (
                processedJournal.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 uppercase text-xs font-bold">
                        {entry.User.last_name[0]}{entry.User.first_name[0]}
                      </div>
                      <div>
                         <p className="font-bold text-slate-700 leading-tight">{entry.User.last_name} {entry.User.first_name}</p>
                         <p className="text-[10px] text-slate-400">{entry.User.middle_name || ''}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {entry.Grades.map(g => (
                          <div key={g.id} className="group relative">
                            <span onClick={() => { setActiveStudent({id: entry.id, name: `${entry.User.last_name} ${entry.User.first_name}`}); setNewGrade({ value: g.value, date: g.grade_date.split('T')[0], comment: g.comment || '' }); setEditingGradeId(g.id); setIsModalOpen(true); }} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold border transition-transform hover:scale-110 cursor-pointer hover:shadow-md ${g.value >= 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-primary-50 text-primary-600 border-primary-200'}`}>
                              {g.value}
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">{new Date(g.grade_date).toLocaleDateString('uk-UA')}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${Number(calculateAverage(entry.Grades)) >= 10 ? 'text-emerald-500' : 'text-slate-600'}`}>{calculateAverage(entry.Grades)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setActiveStudent({id: entry.id, name: `${entry.User.last_name} ${entry.User.first_name}`}); setNewGrade({ value: 10, date: new Date().toISOString().split('T')[0], comment: '' }); setEditingGradeId(null); setIsModalOpen(true); }} className="p-2 text-primary-400 hover:bg-primary-50 rounded-lg transition-colors"><Plus size={20} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ОЦІНКИ (УЧЕНЬ) */}
      {user?.role === 'student' && studentGrades.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200 select-none">
                <th onClick={() => handleSort('subject')} className="p-4 font-medium w-48 cursor-pointer hover:bg-slate-100 group">
                  <div className="flex items-center gap-1">Предмет <SortIcon columnKey="subject" /></div>
                </th>
                <th className="p-4 font-medium">Ваші оцінки</th>
                <th onClick={() => handleSort('average')} className="p-4 font-medium text-center w-32 cursor-pointer hover:bg-slate-100 group">
                  <div className="flex items-center justify-center gap-1">Сер. бал <SortIcon columnKey="average" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {processedStudentGrades.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-500">За вашим запитом предметів не знайдено.</td></tr>
              ) : (
                processedStudentGrades.map((sg, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-2"><BookOpen size={16} className="text-primary-400" /> {sg.subject}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {sg.grades.map(g => (
                          <div key={g.id} className="group relative">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold border transition-transform hover:scale-110 cursor-default ${g.value >= 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-primary-50 text-primary-600 border-primary-200'}`}>
                              {g.value}
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">{new Date(g.grade_date).toLocaleDateString('uk-UA')}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">{calculateAverage(sg.grades)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* МОДАЛКА ВЧИТЕЛЯ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-primary-100">
            <div className="p-6 border-b border-slate-100 bg-primary-50">
              <h2 className="font-bold text-slate-800">{editingGradeId ? 'Редагувати оцінку' : 'Виставити оцінку'}</h2>
              <p className="text-sm text-primary-600">{activeStudent?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Бал (1-12)</label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <button key={num} onClick={() => setNewGrade({...newGrade, value: num})} className={`h-10 rounded-lg border font-bold transition-all ${newGrade.value === num ? 'bg-primary-400 border-primary-400 text-white scale-110 shadow-md' : 'border-slate-200 text-slate-600 hover:border-primary-200'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Дата</label>
                <input type="date" value={newGrade.date} onChange={(e) => setNewGrade({...newGrade, date: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div className="flex gap-3 pt-4">
                {editingGradeId && <button onClick={handleDeleteGrade} className="px-4 py-2 text-status-danger bg-status-danger/10 hover:bg-status-danger hover:text-white rounded-lg font-bold transition-all">Видалити</button>}
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg">Скасувати</button>
                <button onClick={handleSaveGrade} className="flex-1 py-2 bg-primary-400 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-600 transition-all">{editingGradeId ? 'Оновити' : 'Зберегти'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;