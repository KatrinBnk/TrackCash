import db from '../config/db.js';

class User {
    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM Users WHERE id = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.query('SELECT * FROM Users');
        return rows;
    }

    static async findByAll({params}) {
        const { username, role, department_id } = params;
        if (!username && !role && !department_id) return this.findAll();

        let query = 'SELECT * FROM Users';
        const values = [];
        if (username) {
            query += ' WHERE username = ?';
            values.push(username);
        }
        if (role) {
            query += (username ? ' AND' : ' WHERE') + ' role = ?';
            values.push(role);
        }
        if (department_id) {
            query += (username || role ? ' AND' : ' WHERE') + ' department_id = ?';
            values.push(department_id);
        }
        const [rows] = await db.query(query, values);
        return rows;
    }

    static async delete(id) {
        const [user] = await db.query('SELECT * FROM Users WHERE id = ?', [id]);
        if (!user) {
            throw { status: 404, message: 'User not found' };
        }
        if (user[0].role === 'manager' && user[0].department_id) {
            throw { status: 400, message: 'Менеджер привязан к отделу' + user[0].department_id + ' его удаление невозможно'};
        }

        const [result] = await db.query('DELETE FROM Users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async update(id, { surname, name, patronymic, department_id } = {}) {
        const updates = [];
        const values = [];

        // Проверка существования пользователя
        if (await this.findById(id) === null) {
            throw { status: 404, message: 'User not found' };
        }

        // Обновление базовых полей
        if (surname) {
            updates.push('surname = ?');
            values.push(surname);
        }
        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (patronymic) {
            updates.push('patronymic = ?');
            values.push(patronymic);
        }

        // Обработка department_id (включая null)
        if (department_id !== undefined) {
            const [user] = await db.query('SELECT * FROM Users WHERE id = ?', [id]);

            if (department_id === null) {
                // Установка отдела в null
                if (user[0].role === 'manager' && user[0].department_id) {
                    // Очистка manager_id в текущем отделе
                    await db.query(
                        'UPDATE Departments SET manager_id = NULL WHERE id = ? AND manager_id = ?',
                        [user[0].department_id, id]
                    );
                }
                updates.push('department_id = NULL');
            } else {
                // Проверка существования отдела
                const [department] = await db.query('SELECT * FROM Departments WHERE id = ?', [department_id]);
                if (!department.length) {
                    throw { status: 400, message: 'Отдела с таким идентификатором не существует.' };
                }

                if (user[0].role === 'manager') {
                    const currentDepartmentId = user[0].department_id;

                    if (currentDepartmentId && currentDepartmentId !== department_id) {
                        // Проверяем, есть ли уже менеджер в новом отделе
                        const [targetDepartment] = await db.query(
                            'SELECT manager_id FROM Departments WHERE id = ?',
                            [department_id]
                        );

                        if (targetDepartment[0].manager_id && targetDepartment[0].manager_id !== id) {
                            throw { status: 400, message: 'В указанном отделе уже есть менеджер' };
                        }

                        // Очищаем текущий отдел
                        await db.query(
                            'UPDATE Departments SET manager_id = NULL WHERE id = ? AND manager_id = ?',
                            [currentDepartmentId, id]
                        );
                    }

                    // Устанавливаем менеджера в новом отделе
                    await db.query(
                        'UPDATE Departments SET manager_id = ? WHERE id = ?',
                        [id, department_id]
                    );
                }
                updates.push('department_id = ?');
                values.push(department_id);
            }
        }

        if (updates.length === 0) return null;

        // Выполняем обновление пользователя
        values.push(id);
        const query = `UPDATE Users SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        // Возвращаем обновленного пользователя
        const [updated] = await db.query('SELECT * FROM Users WHERE id = ?', [id]);
        return updated[0];
    }

    static async create({ username, password, surname, name, patronymic, role, department_id }) {
        const [result] = await db.query(
            'INSERT INTO Users (username, password, surname, name, patronymic, role, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, password, surname, name, patronymic, role, department_id || null]
        );
        return {
            id: result.insertId,
            username,
            surname,
            name,
            patronymic,
            role
        };
    }
}

export default User;