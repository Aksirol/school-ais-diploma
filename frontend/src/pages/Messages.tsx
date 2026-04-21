import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Send, Plus, Search, MessageSquare, X, User as UserIcon, Edit2, Trash2, Check } from 'lucide-react';

interface Partner {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
}

interface Dialogue {
  partner: Partner;
  lastMessage: { content: string; sent_at: string; is_mine: boolean };
  unreadCount: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
  is_read: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Стейт даних
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [activePartner, setActivePartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // UI стейт
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [modalTab, setModalTab] = useState<'direct' | 'broadcast'>('direct');
  const [availableUsers, setAvailableUsers] = useState<Partner[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<{id: number, name: string}[]>([]);
  const [modalForm, setModalForm] = useState({ receiver_id: '', class_id: '', content: '' });
  const [isSending, setIsSending] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  // Завантаження даних для модального вікна
  useEffect(() => {
    if (isModalOpen) {
      // Завантажуємо список користувачів
      api.get('/messages/users').then(res => setAvailableUsers(res.data));
      
      // Якщо це педагог, завантажуємо його класи
      if (user?.role === 'teacher') {
        api.get('/assignments').then(res => {
          const classesMap = new Map();
          // Отримуємо унікальні класи з призначень
          res.data.forEach((a: any) => classesMap.set(a.Class.id, a.Class));
          setTeacherClasses(Array.from(classesMap.values()));
        });
      }
    }
  }, [isModalOpen, user]);

  useEffect(() => {
  if (socket) {
    socket.on('onlineUsersList', (users: number[]) => setOnlineUsers(users));
    socket.on('userStatusChanged', ({ userId, status }: { userId: number, status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => status === 'online' ? [...prev, userId] : prev.filter(id => id !== userId));
    });
  }
}, [socket]);

  // --- ІНІЦІАЛІЗАЦІЯ SOCKET.IO ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // --- ЗАВАНТАЖЕННЯ ДІАЛОГІВ ТА ПІДПИСКА НА ПОДІЇ ---
  useEffect(() => {
    fetchDialogues();

    if (socket) {
      socket.on('newMessage', (msg: Message) => {
        if (activePartner && (msg.sender_id === activePartner.id || msg.receiver_id === activePartner.id)) {
          // ПРОСТО додаємо повідомлення (бекенд гарантує, що воно одне)
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.receiver_id === user?.id) {
            api.put(`/messages/${activePartner.id}/read`);
          }
        }
        fetchDialogues();
      });

      // НОВЕ: Слухаємо редагування
      socket.on('messageEdited', (updatedMsg: Message) => {
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        fetchDialogues();
      });

      // НОВЕ: Слухаємо видалення
      socket.on('messageDeleted', (deletedId: number) => {
        setMessages(prev => prev.filter(m => m.id !== Number(deletedId)));
        fetchDialogues();
      });

      // НОВЕ: Слухаємо подію прочитання наших повідомлень
      socket.on('messagesRead', ({ readerId }: { readerId: number }) => {
        // Оновлюємо статус повідомлень у відкритому чаті
        setMessages(prev => prev.map(m => 
          (m.receiver_id === Number(readerId) && !m.is_read) 
            ? { ...m, is_read: true } 
            : m
        ));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('messageEdited');
        socket.off('messageDeleted');
        socket.off('onlineUsersList');
        socket.off('userStatusChanged');
        socket.off('messagesRead');
      }
    };
  }, [socket, activePartner]);

  // --- ЗАВАНТАЖЕННЯ ІСТОРІЇ ЧАТУ ---
  useEffect(() => {
    if (activePartner) {
      fetchChatHistory(activePartner.id);
      api.put(`/messages/${activePartner.id}/read`).then(() => fetchDialogues());
    }
  }, [activePartner]);

  // --- АВТОСКРОЛ ДО ОСТАННЬОГО ПОВІДОМЛЕННЯ ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- API ФУНКЦІЇ ---
  const fetchDialogues = async () => {
    try {
      const res = await api.get('/messages/dialogues');
      setDialogues(res.data);
    } catch (error) {
      console.error('Помилка завантаження діалогів');
    }
  };

  const fetchChatHistory = async (partnerId: number) => {
    try {
      const res = await api.get(`/messages/${partnerId}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Помилка завантаження історії');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner) return;

    try {
      await api.post('/messages', {
        receiver_id: activePartner.id,
        content: newMessage
      });
      // Оптимістичне оновлення ВИДАЛЕНО. Чекаємо відповіді від Socket.IO
      setNewMessage('');
    } catch (error) {
      alert('Помилка відправки');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      if (modalTab === 'direct') {
        if (!modalForm.receiver_id || !modalForm.content) return alert('Заповніть всі поля');
        await api.post('/messages', { 
          receiver_id: Number(modalForm.receiver_id), 
          content: modalForm.content 
        });
      } else {
        if (!modalForm.class_id || !modalForm.content) return alert('Заповніть всі поля');
        await api.post('/messages/broadcast', { 
          class_id: Number(modalForm.class_id), 
          content: modalForm.content 
        });
        alert('Розсилку успішно відправлено!');
      }
      
      setIsModalOpen(false);
      setModalForm({ receiver_id: '', class_id: '', content: '' });
      fetchDialogues(); // Оновлюємо ліву панель
    } catch (error) {
      alert('Помилка відправки повідомлення');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!window.confirm('Видалити це повідомлення?')) return;
    try {
      await api.delete(`/messages/msg/${id}`);
    } catch (error) {
      alert('Помилка видалення');
    }
  };

  const submitEdit = async () => {
    if (!editContent.trim() || !editingMsgId) return;
    try {
      await api.put(`/messages/msg/${editingMsgId}`, { content: editContent });
      setEditingMsgId(null);
      setEditContent('');
    } catch (error) {
      alert('Помилка редагування');
    }
  };

  // --- РЕНДЕР ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[calc(100vh-8rem)] flex overflow-hidden">
      
      {/* ЛІВА ПАНЕЛЬ: СПИСОК ДІАЛОГІВ */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-800">Повідомлення</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
            title="Нове повідомлення"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Пошук..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {dialogues.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">У вас ще немає діалогів</p>
            </div>
          ) : (
            dialogues
              .filter(d => `${d.partner.first_name} ${d.partner.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((d) => (
              <div 
                key={d.partner.id}
                onClick={() => setActivePartner(d.partner)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-slate-100 ${activePartner?.id === d.partner.id ? 'bg-primary-50 border-l-4 border-l-primary-400' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                    <UserIcon size={24} />
                  </div>
                  {/* Індикатор онлайн/офлайн */}
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${onlineUsers.includes(d.partner.id) ? 'bg-status-success' : 'bg-slate-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <h3 className="font-bold text-slate-800 truncate">{d.partner.last_name} {d.partner.first_name}</h3>
                      {/* Бейдж Педагога */}
                      {d.partner.role === 'teacher' && (
                        <span className="bg-primary-100 text-primary-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          Педагог
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {new Date(d.lastMessage.sent_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate pr-4">
                    {d.lastMessage.is_mine && <span className="text-primary-400 mr-1">Ви:</span>}
                    {d.lastMessage.content}
                  </p>
                </div>
                {/* Синя крапка непрочитаних */}
                {d.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
                    {d.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ПРАВА ПАНЕЛЬ: ЧАТ */}
      <div className="flex-1 flex flex-col bg-white">
        {activePartner ? (
          <>
            {/* Хедер чату */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white shadow-sm z-10">
              <div className="relative">
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold">
                  {activePartner.last_name[0]}{activePartner.first_name[0]}
                </div>
                {/* Індикатор онлайн/офлайн для відкритого чату */}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${onlineUsers.includes(activePartner.id) ? 'bg-status-success' : 'bg-slate-300'}`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800">{activePartner.last_name} {activePartner.first_name}</h2>
                  {/* Бейдж ролі */}
                  {activePartner.role === 'teacher' && (
                    <span className="bg-primary-100 text-primary-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                      Педагог
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {onlineUsers.includes(activePartner.id) ? 'В мережі' : 'Офлайн'}
                </p>
              </div>
            </div>

            {/* Зона повідомлень */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                const isEditing = editingMsgId === msg.id;
                const formattedTime = new Date(msg.sent_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={msg.id} className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 max-w-[70%]">
                      
                      {/* Кнопки Edit/Delete */}
                      {isMine && !isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                          <button onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content); }} className="p-1.5 text-slate-400 hover:text-primary-500 rounded-md hover:bg-slate-50" title="Редагувати"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-slate-400 hover:text-status-danger rounded-md hover:bg-slate-50" title="Видалити"><Trash2 size={14} /></button>
                        </div>
                      )}

                      {/* Бульбашка */}
                      {isEditing ? (
                        <div className="flex bg-white border border-primary-300 rounded-xl overflow-hidden shadow-sm">
                          <input autoFocus type="text" value={editContent} onChange={e => setEditContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitEdit()} className="px-3 py-2 outline-none text-sm min-w-[200px]" />
                          <button onClick={submitEdit} className="bg-primary-50 px-3 text-primary-600 hover:bg-primary-100"><Check size={16} /></button>
                          <button onClick={() => setEditingMsgId(null)} className="bg-slate-50 px-3 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className={`px-4 py-2 rounded-2xl shadow-sm ${isMine ? 'bg-primary-400 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                          {msg.content}
                        </div>
                      )}
                    </div>

                    {/* Час та галочки прочитання */}
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-slate-400">{formattedTime}</span>
                      {isMine && (
                        <span className="flex">
                          <Check size={12} className={msg.is_read ? "text-primary-400" : "text-slate-300"} />
                          {msg.is_read && <Check size={12} className="text-primary-400 -ml-1.5" />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Зона вводу */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Напишіть повідомлення..." 
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-3 bg-primary-400 hover:bg-primary-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors flex items-center justify-center shadow-sm"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500">Оберіть діалог</p>
            <p className="text-sm">Або створіть новий чат за допомогою кнопки "+"</p>
          </div>
        )}
      </div>

      {/* МОДАЛЬНЕ ВІКНО НОВОГО ПОВІДОМЛЕННЯ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h2 className="text-xl font-bold text-slate-800">Нове повідомлення</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-status-danger transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Вкладки (тільки для вчителя) */}
              {user?.role === 'teacher' && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
                  <button 
                    onClick={() => setModalTab('direct')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modalTab === 'direct' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Особисте
                  </button>
                  <button 
                    onClick={() => setModalTab('broadcast')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modalTab === 'broadcast' ? 'bg-white shadow text-accent-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Розсилка класу
                  </button>
                </div>
              )}

              <form onSubmit={handleModalSubmit} className="space-y-4">
                {modalTab === 'direct' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Отримувач</label>
                    <select 
                      value={modalForm.receiver_id}
                      onChange={e => setModalForm({...modalForm, receiver_id: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none bg-white"
                    >
                      <option value="">-- Оберіть користувача --</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.last_name} {u.first_name} ({u.role === 'teacher' ? 'Педагог' : 'Учень'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Оберіть клас</label>
                    <select 
                      value={modalForm.class_id}
                      onChange={e => setModalForm({...modalForm, class_id: e.target.value})}
                      className="w-full p-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-accent-400 outline-none bg-white"
                    >
                      <option value="">-- Ваші класи --</option>
                      {teacherClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Текст повідомлення</label>
                  <textarea 
                    value={modalForm.content}
                    onChange={e => setModalForm({...modalForm, content: e.target.value})}
                    rows={4}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none resize-none"
                    placeholder="Напишіть повідомлення..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                    Скасувати
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSending || !modalForm.content || (modalTab === 'direct' ? !modalForm.receiver_id : !modalForm.class_id)}
                    className={`flex-1 py-2 text-white rounded-lg font-medium transition-colors ${modalTab === 'direct' ? 'bg-primary-400 hover:bg-primary-600' : 'bg-accent-400 hover:bg-accent-600'} disabled:bg-slate-300`}
                  >
                    {isSending ? 'Відправка...' : 'Відправити'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;