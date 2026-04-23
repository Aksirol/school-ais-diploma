import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileText, Presentation, File as FileIcon, Video, Link as LinkIcon, 
  Search, X, Download, Filter, ExternalLink, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { saveAs } from 'file-saver';

// --- ІНТЕРФЕЙСИ ---
interface Material {
  id: number;
  title: string;
  type: 'pdf' | 'ppt' | 'doc' | 'video' | 'link';
  url: string;
  uploaded_at: string;
  teacher_subject_id: number;
}

interface Assignment {
  id: number;
  Class: { name: string; year: number };
  Subject: { name: string };
}

// --- ВАЛІДАЦІЯ ФОРМИ (Zod) ---
const uploadSchema = z.object({
  title: z.string().min(3, 'Назва має містити мінімум 3 символи'),
  teacher_subject_id: z.string().min(1, 'Оберіть клас та предмет'),
  type: z.enum(['pdf', 'ppt', 'doc', 'video', 'link']),
  url: z.string().optional(),
}).refine((data) => {
  if (data.type === 'link' && (!data.url || data.url.trim() === '')) return false;
  return true;
}, { message: 'Введіть коректне посилання', path: ['url'] });

type UploadForm = z.infer<typeof uploadSchema>;

const Materials = () => {
  const { user } = useAuth();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { type: 'pdf' }
  });

  const selectedType = watch('type');

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) { console.error('Помилка завантаження', error); }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) { console.error('Помилка завантаження', error); }
  };

  useEffect(() => {
    fetchMaterials();
    if (user?.role === 'teacher') fetchAssignments();
  }, [user]);

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm('Видалити цей навчальний матеріал?')) return;
    try {
      await api.delete(`/materials/${id}`);
      fetchMaterials();
    } catch (error) { alert('Помилка видалення матеріалу'); }
  };

  // --- БЕЗПЕЧНЕ ЗАВАНТАЖЕННЯ ---
  const handleDownload = async (fileUrl: string) => {
    try {
      const filename = fileUrl.split('/').pop();
      const res = await api.get(`/files/${filename}`, { responseType: 'blob' });
      saveAs(res.data, filename || 'document');
    } catch (error) {
      alert('Помилка завантаження. Файл недоступний або у вас немає прав.');
    }
  };

  const onSubmit = async (data: UploadForm) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('teacher_subject_id', data.teacher_subject_id);
      formData.append('type', data.type);
      
      if (data.type === 'link') {
        formData.append('url', data.url!);
      } else {
        if (!selectedFile) { alert('Будь ласка, оберіть файл'); return; }
        formData.append('file', selectedFile);
      }

      await api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      setIsModalOpen(false);
      reset();
      setSelectedFile(null);
      fetchMaterials();
    } catch (error: any) { alert(error.response?.data?.message || 'Помилка завантаження'); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-status-danger" />;
      case 'ppt': return <Presentation className="text-status-warning" />;
      case 'doc': return <FileIcon className="text-primary-600" />;
      case 'video': return <Video className="text-purple-500" />;
      case 'link': return <LinkIcon className="text-accent-400" />;
      default: return <FileIcon />;
    }
  };

  const filteredMaterials = useMemo(() => {
    let result = [...materials];
    result = result.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter ? m.type === typeFilter : true;
      return matchesSearch && matchesType;
    });
    result.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    return result;
  }, [materials, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex-1 w-full flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Пошук матеріалів..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-primary-50 border border-primary-100 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="pl-10 pr-8 py-2 bg-primary-50 border border-primary-100 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none appearance-none">
              <option value="">Всі типи файлів</option>
              <option value="pdf">PDF Документи</option>
              <option value="ppt">Презентації (PPT)</option>
              <option value="doc">Текстові (DOC)</option>
              <option value="video">Відео</option>
              <option value="link">Посилання</option>
            </select>
          </div>
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">Матеріалів не знайдено.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-primary-400 transition-colors flex flex-col h-full group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                  {getIcon(material.type)}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{material.type}</span>
              </div>
              
              <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 flex-grow" title={material.title}>
                {material.title}
              </h3>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">{new Date(material.uploaded_at).toLocaleDateString('uk-UA')}</span>
                
                <div className="flex gap-2">
                  {/* ПЕРЕВІРКА: Якщо лінк - звичайне посилання, якщо файл - кнопка handleDownload */}
                  {material.type === 'link' ? (
                    <a 
                      href={material.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-400 hover:text-white rounded-lg transition-colors"
                      title="Відкрити посилання"
                    >
                      <ExternalLink size={18} />
                    </a>
                  ) : (
                    <button 
                      onClick={() => handleDownload(material.url)}
                      className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-400 hover:text-white rounded-lg transition-colors"
                      title="Завантажити файл"
                    >
                      <Download size={18} />
                    </button>
                  )}
                  
                  {user?.role !== 'student' && (
                    <button 
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="p-2 text-status-danger bg-status-danger/10 hover:bg-status-danger hover:text-white rounded-lg transition-colors"
                      title="Видалити"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО ЗАВАНТАЖЕННЯ ЗАЛИШАЄТЬСЯ БЕЗ ЗМІН */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h2 className="text-xl font-bold text-slate-800">Новий матеріал</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-status-danger transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Назва матеріалу</label>
                <input {...register('title')} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none border-slate-300" placeholder="Напр: Конспект Лекції №1" />
                {errors.title && <p className="text-status-danger text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Клас та Предмет</label>
                <select {...register('teacher_subject_id')} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none bg-white border-slate-300">
                  <option value="">-- Оберіть призначення --</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.Class.year} / {a.Class.name} — {a.Subject.name}
                    </option>
                  ))}
                </select>
                {errors.teacher_subject_id && <p className="text-status-danger text-xs mt-1">{errors.teacher_subject_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Тип матеріалу</label>
                <select {...register('type')} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none bg-white border-slate-300">
                  <option value="pdf">PDF Документ</option>
                  <option value="ppt">Презентація (PPT/PPTX)</option>
                  <option value="doc">Текстовий документ (DOC/DOCX)</option>
                  <option value="video">Відеофайл</option>
                  <option value="link">Зовнішнє посилання</option>
                </select>
              </div>

              {selectedType === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Посилання</label>
                  <input {...register('url')} type="url" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none border-slate-300" placeholder="https://..." />
                  {errors.url && <p className="text-status-danger text-xs mt-1">{errors.url.message}</p>}
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary-200 bg-primary-50 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                  <input 
                    type="file" 
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 cursor-pointer"
                  />
                  {!selectedFile && <p className="text-xs text-slate-500 mt-2">Макс. розмір файлу: 100 МБ</p>}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                  Скасувати
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-primary-400 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg font-medium transition-colors">
                  {isSubmitting ? 'Завантаження...' : 'Зберегти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;