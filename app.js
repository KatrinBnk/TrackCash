import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import hbs from 'hbs';
import cookieParser from 'cookie-parser';

// Импорт маршрутов API
import authRoutes from './routes/api/auth.js';
import transactionRoutes from './routes/api/transactions.js';
import departmentRoutes from './routes/api/departments.js';
import categoryRoutes from './routes/api/categories.js';
import userRouter from './routes/api/user.js';
import statisticsRouter from './routes/api/statistics.js';

// Импорт маршрутов рендеринга страниц
import viewRoutes from './routes/views.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Подключение маршрутов API
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRouter);
app.use('/api/statistics', statisticsRouter);

// Подключение маршрутов рендеринга страниц
app.use('/', viewRoutes);

export default app;