import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10),
    dialect: 'postgres',
    logging: false, // вимикаємо логування SQL-запитів у консоль, щоб не смітити
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL підключено успішно.');
  } catch (error) {
    console.error('Помилка підключення до бази даних:', error);
    process.exit(1);
  }
};