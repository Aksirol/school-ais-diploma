# Етап 1: Білд React
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Змінюємо змінну середовища для продакшена на хост API
ENV VITE_API_URL=/api
RUN npm run build

# Етап 2: Сервер Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Копіюємо наш кастомний конфіг (його створимо наступним)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]