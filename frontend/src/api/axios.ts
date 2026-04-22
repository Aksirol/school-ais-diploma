import axios from 'axios';

const api = axios.create({
  // Беремо з .env, а якщо змінної немає (напр. забули додати) - використовуємо фолбек
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

// Додаємо токен до кожного запиту, якщо він є в localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обробка помилок (наприклад, якщо токен протермінувався)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;