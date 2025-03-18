import db from '../config/db.js';
import bcrypt from 'bcrypt';

export const setupDatabase = async () => {
    // Очищаем таблицы
    await db.query('DELETE FROM Transactions');
    await db.query('DELETE FROM Categories');
    await db.query('DELETE FROM Departments');
    await db.query('DELETE FROM Users');

    // Сбрасываем автоинкремент
    await db.query('ALTER TABLE Users AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE Categories AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE Departments AUTO_INCREMENT = 1');

    // Создаём тестового администратора
    const adminPassword = await bcrypt.hash('123456', 10);
    await db.query(
        'INSERT INTO Users (username, password, role, surname, name, patronymic) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin1', adminPassword, 'admin', 'Ivanov', 'Ivan', 'Ivanovich']
    );

    // Тестового менеджера
    const managerPassword = await bcrypt.hash('123456', 10);
    await db.query(
        'INSERT INTO Users (username, password, role, surname, name, patronymic) VALUES (?, ?, ?, ?, ?, ?)',
        ['manager1', managerPassword, 'manager', 'Mironova', 'Irina', 'Grygorievna']
    );

    // Тестового сотрудника
    const employeePassword = await bcrypt.hash('123456', 10);
    await db.query(
        'INSERT INTO Users (username, password, role, surname, name, patronymic) VALUES (?, ?, ?, ?, ?, ?)',
        ['employee1', employeePassword, 'employee', 'Smirnov', 'Ivan', 'Kirilovich']
    );

    // Создаём категорию
    const [categoryResult] = await db.query(
        'INSERT INTO Categories (name, department_id) VALUES (?, ?)',
        ['General Expenses', null]
    );
    return { categoryId: categoryResult.insertId };
};