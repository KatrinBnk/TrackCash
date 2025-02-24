import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import departmentRoutes from './routes/departments.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/departments', departmentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;