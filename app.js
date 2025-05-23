const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');

// Импорт маршрутов API
const authRoutes = require('./routes/api/auth.js');
const transactionRoutes = require('./routes/api/transactions.js');
const departmentRoutes = require('./routes/api/departments.js');
const categoryRoutes = require('./routes/api/categories.js');
const userRouter = require('./routes/api/user.js');
const statisticsRouter = require('./routes/api/statistics.js');

// Импорт маршрутов рендеринга страниц
const viewRoutes = require('./routes/views.js');

dotenv.config();

const app = express();

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

module.exports = app;