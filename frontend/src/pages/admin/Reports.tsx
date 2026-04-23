import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, GraduationCap, Award, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ classes: 0, teachers: 0, students: 0, subjects: 0 });
  const [classAverages, setClassAverages] = useState<{name: string, avg: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (user?.role === 'admin') {
          // --- АНАЛІТИКА ДЛЯ АДМІНА ---
          const [classesRes, usersRes, gradesRes] = await Promise.all([
            api.get('/academic/classes'),
            api.get('/admin/users/active'),
            api.get('/grades') 
          ]);
          
          setStats({
            classes: classesRes.data.length || 0,
            teachers: usersRes.data.filter((u: any) => u.role === 'teacher').length || 0,
            students: usersRes.data.filter((u: any) => u.role === 'student').length || 0,
            subjects: 0 // Адміну це поле не так важливе тут
          });

          const grades = gradesRes.data;
          const classGrades: Record<string, number[]> = {};

          grades.forEach((g: any) => {
            const className = g.TeacherSubject?.Class?.name;
            if (className) {
              if (!classGrades[className]) classGrades[className] = [];
              classGrades[className].push(g.value);
            }
          });

          const averages = Object.entries(classGrades).map(([name, vals]) => {
            const avg = vals.reduce((sum, val) => sum + val, 0) / vals.length;
            return { name, avg: Number(avg.toFixed(1)) };
          });

          setClassAverages(averages.sort((a, b) => b.avg - a.avg));

        } else if (user?.role === 'teacher') {
          // --- АНАЛІТИКА ДЛЯ ВЧИТЕЛЯ ---
          const assignmentsRes = await api.get('/assignments');
          const assignments = assignmentsRes.data;

          const uniqueClasses = new Set(assignments.map((a: any) => a.class_id));
          const uniqueSubjects = new Set(assignments.map((a: any) => a.subject_id));

          const averages: {name: string, avg: number}[] = [];
          let uniqueStudents = new Set();

          // Отримуємо журнали для кожного предмета вчителя
          for (const assignment of assignments) {
            try {
              const journalRes = await api.get(`/grades/journal/${assignment.id}`);
              const journal = journalRes.data; 

              let subjectSum = 0;
              let subjectCount = 0;

              journal.forEach((entry: any) => {
                uniqueStudents.add(entry.User.id);
                entry.Grades.forEach((g: any) => {
                  subjectSum += g.value;
                  subjectCount++;
                });
              });

              if (subjectCount > 0) {
                 averages.push({
                   name: `${assignment.Class.name} (${assignment.Subject.name})`,
                   avg: Number((subjectSum / subjectCount).toFixed(1))
                 });
              }
            } catch (e) { console.error('Журнал порожній', e); }
          }

          setStats({
            classes: uniqueClasses.size,
            teachers: 1, 
            students: uniqueStudents.size,
            subjects: uniqueSubjects.size
          });

          setClassAverages(averages.sort((a, b) => b.avg - a.avg));
        }
      } catch (error) {
        console.error('Помилка завантаження аналітики:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (isLoading) return <div className="p-10 text-center text-slate-500">Генерація звітів...</div>;

  const totalAvg = classAverages.length > 0 
    ? (classAverages.reduce((sum, c) => sum + c.avg, 0) / classAverages.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <BarChart3 className="text-primary-400" /> 
          {user?.role === 'admin' ? 'Аналітика закладу' : 'Моя аналітика успішності'}
        </h2>
        <p className="text-slate-500">
          {user?.role === 'admin' ? 'Зведені дані про успішність та активність користувачів' : 'Статистика по ваших класах та предметах'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl"><Award size={24} /></div>
          <div><p className="text-slate-500 text-sm font-bold uppercase">Середній бал</p><p className="text-2xl font-bold text-slate-800">{totalAvg}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-primary-100 text-primary-600 p-4 rounded-xl"><GraduationCap size={24} /></div>
          <div><p className="text-slate-500 text-sm font-bold uppercase">{user?.role === 'admin' ? 'Учнів' : 'Моїх учнів'}</p><p className="text-2xl font-bold text-slate-800">{stats.students}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className={`${user?.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'} p-4 rounded-xl`}>
            {user?.role === 'admin' ? <Users size={24} /> : <BookOpen size={24} />}
          </div>
          <div><p className="text-slate-500 text-sm font-bold uppercase">{user?.role === 'admin' ? 'Педагогів' : 'Предметів'}</p><p className="text-2xl font-bold text-slate-800">{user?.role === 'admin' ? stats.teachers : stats.subjects}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-accent-100 text-accent-600 p-4 rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-slate-500 text-sm font-bold uppercase">{user?.role === 'admin' ? 'Класів' : 'Моїх класів'}</p><p className="text-2xl font-bold text-slate-800">{stats.classes}</p></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
          {user?.role === 'admin' ? 'Рейтинг класів за успішністю (Середній бал)' : 'Успішність по моїх групах'}
        </h3>
        
        {classAverages.length === 0 ? (
          <div className="text-center text-slate-500 py-8 border border-dashed border-slate-200 rounded-lg">Оцінок ще немає для формування рейтингу.</div>
        ) : (
          <div className="space-y-6">
            {classAverages.map((c, idx) => (
              <div key={c.name}>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">{idx + 1}. {user?.role === 'admin' ? `${c.name} клас` : c.name}</span>
                  <span className="font-bold text-emerald-500">{c.avg}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className="bg-primary-400 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${(c.avg / 12) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;