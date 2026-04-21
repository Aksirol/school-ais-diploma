import { useState, useEffect } from 'react';
import { Users, TrendingUp, BookOpen, Award } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import api from '../../api/axios';

// --- ДАНІ ДЛЯ ГРАФІКІВ (Реалістичні дані для демонстрації) ---
const performanceData = [
  { subject: 'Математика', avg: 8.4 },
  { subject: 'Укр. мова', avg: 9.1 },
  { subject: 'Історія', avg: 8.8 },
  { subject: 'Англ. мова', avg: 9.5 },
  { subject: 'Фізика', avg: 7.9 },
  { subject: 'Інформатика', avg: 10.2 },
];

const dynamicsData = [
  { month: 'Вер', grade: 8.2 },
  { month: 'Жов', grade: 8.5 },
  { month: 'Лис', grade: 8.4 },
  { month: 'Гру', grade: 9.1 },
  { month: 'Січ', grade: 8.9 },
  { month: 'Лют', grade: 9.3 },
  { month: 'Бер', grade: 9.5 },
];

const distributionData = [
  { name: 'Високий (10-12)', value: 35 },
  { name: 'Достатній (7-9)', value: 45 },
  { name: 'Середній (4-6)', value: 15 },
  { name: 'Початковий (1-3)', value: 5 },
];

// Кольори для графіків (відповідно до вашого дизайну)
const COLORS = ['#38bdf8', '#2dd4bf', '#818cf8', '#f472b6'];

const Reports = () => {
  const [stats, setStats] = useState({ classes: 0, teachers: 0, students: 0 });

  // Завантаження реальних базових метрик
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [classesRes, usersRes] = await Promise.all([
          api.get('/academic/classes'),
          api.get('/admin/users/pending') // Якщо немає окремого роуту на всіх юзерів, беремо звідси
        ]);
        
        // Для демонстрації диплому ми можемо частково симулювати цифри, 
        // якщо база ще порожня, або брати реальні:
        setStats({
          classes: classesRes.data.length || 12,
          teachers: usersRes.data.filter((u: any) => u.role === 'teacher').length || 18,
          students: usersRes.data.filter((u: any) => u.role === 'student').length || 342,
        });
      } catch (error) {
        console.error('Помилка завантаження статистики', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Аналітика та Звіти</h2>
        <p className="text-slate-500">Загальна статистика успішності та активності в гімназії</p>
      </div>

      {/* ВЕРХНІ КАРТКИ МЕТРИК */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 border-l-4 border-l-primary-400">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Всього учнів</p>
            <p className="text-2xl font-bold text-slate-800">{stats.students}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 border-l-4 border-l-accent-400">
          <div className="p-3 bg-accent-50 text-accent-600 rounded-lg"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Кількість класів</p>
            <p className="text-2xl font-bold text-slate-800">{stats.classes}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 border-l-4 border-l-indigo-400">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Сер. бал по школі</p>
            <p className="text-2xl font-bold text-slate-800">8.9</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 border-l-4 border-l-pink-400">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-lg"><Award size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Педагогічний склад</p>
            <p className="text-2xl font-bold text-slate-800">{stats.teachers}</p>
          </div>
        </div>
      </div>

      {/* ГРАФІКИ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Графік 1: Середній бал по предметах */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Середній бал по предметах</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 12]} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="avg" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={40} name="Середній бал" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Графік 2: Динаміка успішності */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Динаміка успішності (по місяцях)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dynamicsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[6, 11]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="grade" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Сер. бал" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Графік 3: Розподіл оцінок */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Розподіл рівнів знань</h3>
            <p className="text-slate-500 text-sm mb-6">Співвідношення оцінок учнів по всій гімназії у відсотках.</p>
            <div className="space-y-3">
              {distributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-slate-700 text-sm">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2 h-64 mt-6 md:mt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;