import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, User as UserIcon } from 'lucide-react';
import api from '../api/axios';

const DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця'];
const TIME_SLOTS = [
  { num: 1, time: '08:30 - 09:15' },
  { num: 2, time: '09:25 - 10:10' },
  { num: 3, time: '10:30 - 11:15' },
  { num: 4, time: '11:35 - 12:20' },
  { num: 5, time: '12:30 - 13:15' },
  { num: 6, time: '13:25 - 14:10' },
  { num: 7, time: '14:20 - 15:05' },
];

const Schedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('5-А'); // Для адміна/вчителя

  useEffect(() => {
    // Імітація завантаження розкладу
    setIsLoading(true);
    setTimeout(() => {
      // Тимчасові демо-дані
      setSchedule([
        { day: 'Понеділок', lessonNum: 1, subject: 'Математика', teacher: 'Коваленко О.І.', room: 'Каб. 301' },
        { day: 'Понеділок', lessonNum: 2, subject: 'Укр. мова', teacher: 'Шевченко М.В.', room: 'Каб. 205' },
        { day: 'Понеділок', lessonNum: 3, subject: 'Англ. мова', teacher: 'Петренко І.С.', room: 'Каб. 412' },
        { day: 'Вівторок', lessonNum: 1, subject: 'Історія', teacher: 'Бойко В.М.', room: 'Каб. 210' },
        { day: 'Вівторок', lessonNum: 2, subject: 'Математика', teacher: 'Коваленко О.І.', room: 'Каб. 301' },
        { day: 'Вівторок', lessonNum: 3, subject: 'Інформатика', teacher: 'Сидоренко О.П.', room: 'Каб. 105' },
        { day: 'Середа', lessonNum: 2, subject: 'Фізика', teacher: 'Григоренко Т.В.', room: 'Каб. 305' },
      ]);
      setIsLoading(false);
    }, 500);
  }, [selectedClass]);

  const getLesson = (day: string, num: number) => {
    return schedule.find(s => s.day === day && s.lessonNum === num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-primary-400" />
            Розклад занять
          </h2>
          <p className="text-slate-500">
            {user?.role === 'student' ? 'Ваш розклад на поточний тиждень' : 'Перегляд розкладу по класах'}
          </p>
        </div>
        
        {user?.role !== 'student' && (
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-slate-50 font-medium text-slate-700"
          >
            <option value="5-А">5-А клас</option>
            <option value="5-Б">5-Б клас</option>
            <option value="6-А">6-А клас</option>
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="text-center p-10 text-slate-500">Завантаження розкладу...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 w-24 text-center font-bold text-slate-500 uppercase text-xs">Час</th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 font-bold text-slate-700 text-center w-[18%] border-l border-slate-200">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(slot => (
                <tr key={slot.num} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-4 border-r border-slate-200 bg-slate-50 text-center">
                    <div className="font-bold text-slate-700">{slot.num} урок</div>
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                      <Clock size={10} /> {slot.time}
                    </div>
                  </td>
                  {DAYS.map(day => {
                    const lesson = getLesson(day, slot.num);
                    return (
                      <td key={`${day}-${slot.num}`} className="p-3 border-r border-slate-100 relative group align-top h-24">
                        {lesson ? (
                          <div className="bg-primary-50 border border-primary-100 rounded-lg p-2 h-full flex flex-col justify-between hover:border-primary-400 transition-colors cursor-pointer">
                            <div className="font-bold text-primary-700 text-sm leading-tight">{lesson.subject}</div>
                            <div className="mt-2 space-y-1">
                              <div className="text-[10px] text-slate-600 flex items-center gap-1 truncate">
                                <UserIcon size={10} className="text-slate-400 shrink-0" />
                                <span className="truncate" title={lesson.teacher}>{lesson.teacher}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                <MapPin size={10} className="text-status-warning shrink-0" />
                                {lesson.room}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-lg border border-dashed border-transparent group-hover:border-slate-200 transition-colors"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Schedule;