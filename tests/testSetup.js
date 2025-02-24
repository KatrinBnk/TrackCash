import db from '../config/db.js';
import bcrypt from 'bcrypt';

export const setupDatabase = async () => {

    // NOTE: очищу бдшку перед тестами, но лучше так уж не делать (убрать позже). сейчас просто чтобы быть уверенной в тестах
    await db.query('DELETE FROM Transactions');
    await db.query('DELETE FROM Categories');
    await db.query('DELETE FROM Departments');
    await db.query('DELETE FROM Users');

    // NOTE: тестовый админ
    const hashedPassword = await bcrypt.hash('123456', 10);
    await db.query('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)', ['admin1', hashedPassword, 'admin']);

    // NOTE: тестовая категория
    await db.query('INSERT INTO Categories (name, department_id) VALUES (?, ?)', ['General Expenses', null]);
};