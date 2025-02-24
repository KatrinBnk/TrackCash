import db from '../config/db.js';
import bcrypt from 'bcrypt';

export const setupDatabase = async () => {
    // Очищаем таблицы
    await db.query('DELETE FROM Transactions');
    await db.query('DELETE FROM Categories');
    await db.query('DELETE FROM Departments');
    await db.query('DELETE FROM Users');

    await db.query('ALTER TABLE Users AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE Categories AUTO_INCREMENT = 1');

    const adminPassword = await bcrypt.hash('123456', 10);
    await db.query(
        'INSERT INTO Users (username, password, role) VALUES (?, ?, ?)',
        ['admin1', adminPassword, 'admin']
    );

    const [categoryResult] = await db.query(
        'INSERT INTO Categories (name, department_id) VALUES (?, ?)',
        ['General Expenses', null]
    );
    return { categoryId: categoryResult.insertId }; // Возвращаем ID созданной категории
};