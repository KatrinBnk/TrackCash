import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import departmentRoutes from './routes/departments.js';
import categoryRoutes from './routes/categories.js';
import statsRoutes from './routes/stats.js';
import userRouter from './routes/user.js'
import path from 'path';
import { fileURLToPath } from 'url';
import hbs from 'hbs';
import { authenticateToken, restrictToAdmin } from './middleware/clientAuth.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Подключение маршрутов API
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRouter);

app.get('/admin', (req, res) => {
    res.render('admin/index');
});

app.get('/admin/employees', (req, res)=>{
    res.render('admin/employees')
})
app.get('/admin/departments', (req, res)=>{
    res.render('admin/departments')
})

// Страница логина
app.get('/login', (req, res) => {
    res.render('auth/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} http://localhost:${PORT}`);
});

export default app;