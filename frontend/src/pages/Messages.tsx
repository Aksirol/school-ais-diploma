import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Send, Plus, Search, MessageSquare, X, Users, User as UserIcon } from 'lucide-react';

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
        // Якщо повідомлення належить поточному відкритому чату
        if (activePartner && (msg.sender_id === activePartner.id || msg.receiver_id === activePartner.id)) {
          setMessages(prev => {
            // Перевірка на дублікати (бо ми локально теж додаємо повідомлення при відправці)
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          // Якщо ми отримали повідомлення і чат відкритий - позначаємо прочитаним
          if (msg.receiver_id === user?.id) {
            api.put(`/messages/${activePartner.id}/read`);
          }
        }
        
        // Оновлюємо список діалогів у будь-якому випадку (щоб оновити останнє повідомлення і лічильник)
        fetchDialogues();
      });
    }

    return () => {
      if (socket) socket.off('newMessage');
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
      const res = await api.post('/messages', {
        receiver_id: activePartner.id,
        content: newMessage
      });
      // Оптимістичне оновлення інтерфейсу (додаємо повідомлення до того, як сокет його поверне)
      setMessages(prev => [...prev, res.data.data]);
      setNewMessage('');
      fetchDialogues();
    } catch (error) {
      alert('Помилка відправки');
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
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-800 truncate">{d.partner.last_name} {d.partner.first_name}</h3>
                    <span className="text-[10px] text-slate-400">
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
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold">
                {activePartner.last_name[0]}{activePartner.first_name[0]}
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{activePartner.last_name} {activePartner.first_name}</h2>
                <p className="text-xs text-slate-500 capitalize">{activePartner.role === 'teacher' ? 'Педагог' : 'Учень'}</p>
              </div>
            </div>

            {/* Зона повідомлень */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isMine ? 'bg-primary-400 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.sent_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && (
                        <span className="text-[10px]">
                          {msg.is_read ? <span className="text-primary-400">✓✓</span> : <span className="text-slate-400">✓</span>}
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

      {/* МОДАЛЬНЕ ВІКНО НОВОГО ПОВІДОМЛЕННЯ (ЗАГЛУШКА ДЛЯ ДИПЛОМУ) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h2 className="text-xl font-bold text-slate-800">Нове повідомлення</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-status-danger">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-500 mb-6">
                Тут має бути список усіх користувачів системи для початку нового діалогу, 
                а також форма для масової розсилки класу (якщо ви педагог).
              </p>
              {user?.role === 'teacher' && (
                <div className="p-4 bg-accent-50 border border-accent-100 rounded-xl flex items-start gap-3 mb-4">
                  <Users className="text-accent-400 shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-bold text-accent-700">Розсилка класу</h3>
                    <p className="text-sm text-accent-600">Для реалізації цього функціоналу потрібно завантажити список класів вчителя та викликати роут POST /api/messages/broadcast</p>
                  </div>
                </div>
              )}
              <button onClick={() => setIsModalOpen(false)} className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;