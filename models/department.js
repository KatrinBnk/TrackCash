import db from '../config/db.js';

class Department {

    /**
     * Создаёт новый отдел с указанным названием и опциональным менеджером.
     *
     * @async
     * @function create
     * @param {Object} data - Данные для создания отдела.
     * @param {string} data.name - Название нового отдела.
     * @param {string} [data.manager_id] - ID менеджера, привязанного к отделу (опционально).
     * @returns {Promise<Object>} - Возвращает объект созданного отдела с полями id, name и manager_id.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если создание невозможно.
     */
    static async create({ name, manager_id }) {
        if (!name) {
            throw { status: 400, message: 'Название отдела обязательно' };
        }

        if (manager_id) {
            const [managerRows] = await db.query(
                'SELECT * FROM Users WHERE id = ? AND role = "manager"',
                [manager_id]
            );
            const manager = managerRows[0];
            if (!manager) {
                throw { status: 400, message: 'Недопустимый manager_id: пользователь должен быть менеджером' };
            }
            if (manager.department_id) {
                throw { status: 400, message: 'Менеджер уже привязан к другому отделу' };
            }
        }

        const [result] = await db.query(
            'INSERT INTO Departments (name, manager_id) VALUES (?, ?)',
            [name, manager_id || null]
        );
        return { id: result.insertId, name, manager_id };
    }

    /**
     * Обновляет существующий отдел по его ID.
     *
     * @async
     * @function update
     * @param {string} id - ID отдела для обновления.
     * @param {Object} data - Данные для обновления отдела.
     * @param {string} [data.name] - Новое название отдела (опционально).
     * @param {string} [data.manager_id] - Новый ID менеджера отдела (опционально).
     * @returns {Promise<Object>} - Возвращает объект обновлённого отдела.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если обновление невозможно.
     */
    static async update(id, { name, manager_id }) {
        const updates = [];
        const values = [];

        if(await this.getById(id) === null) {
            throw { status: 404, message: 'Отдел не найден' };
        }

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (manager_id !== undefined) {
            const [managerRows] = await db.query('SELECT * FROM Users WHERE id = ? AND role = "manager"', [manager_id]);
            const manager = managerRows[0];
            if (!manager) {
                throw { status: 400, message: 'Недопустимый manager_id: пользователь должен быть менеджером' };
            }
            if (manager.department_id) {
                throw { status: 400, message: `Менеджер с ID ${manager_id} уже привязан к отделу ${manager.department_id}` };
            }
            updates.push('manager_id = ?');
            values.push(manager_id);
        }

        if (updates.length === 0) {
            throw { status: 400, message: 'Не указано ни одно поле для обновления' };
        }

        values.push(id);
        const query = `UPDATE Departments SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        if (manager_id !== undefined) {
            await db.query('UPDATE Users SET department_id = ? WHERE id = ?', [id, manager_id]);
        }

        const [updated] = await db.query('SELECT * FROM Departments WHERE id = ?', [id]);
        return updated[0];
    }

    /**
     * Получает список всех отделов.
     *
     * @async
     * @function getAll
     * @returns {Promise<Object[]>} - Возвращает массив объектов отделов.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если запрос к базе данных невозможен.
     */
    static async getAll() {
        try {
            const [departments] = await db.query('SELECT * FROM Departments');
            return departments;
        } catch (err) {
            throw { status: 500, message: 'Ошибка при получении списка отделов: ' + err.message };
        }
    }

    /**
     * Получает отдел по его ID.
     *
     * @async
     * @function getById
     * @param {string} id - ID отдела.
     * @returns {Promise<Object|null>} - Возвращает объект отдела или null, если отдел не найден.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если запрос невозможен.
     */
    static async getById(id) {
        if (!id) {
            throw { status: 400, message: 'ID отдела обязателен' };
        }
        try {
            const [departments] = await db.query('SELECT * FROM Departments WHERE id = ?', [id]);
            return departments[0] || null;
        } catch (err) {
            throw { status: 500, message: 'Ошибка при получении отдела: ' + err.message };
        }
    }

    /**
     * Получает отдел по ID менеджера.
     *
     * @async
     * @function getByManagerId
     * @param {string} managerId - ID менеджера, привязанного к отделу.
     * @returns {Promise<Object|null>} - Возвращает объект отдела или null, если отдел не найден.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если запрос невозможен.
     */
    static async getByManagerId(managerId) {
        if (!managerId) {
            throw { status: 400, message: 'ID менеджера обязателен' };
        }
        try {
            const [departments] = await db.query('SELECT * FROM Departments WHERE manager_id = ?', [managerId]);
            return departments[0] || null;
        } catch (err) {
            throw { status: 500, message: 'Ошибка при получении отдела по менеджеру: ' + err.message };
        }
    }

    /**
     * Удаляет отдел по его ID, если к нему не привязаны пользователи или категории.
     *
     * @async
     * @function delete
     * @param {string} id - ID отдела для удаления.
     * @returns {Promise<boolean>} - Возвращает true, если отдел успешно удалён, иначе false.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если удаление невозможно.
     */
    static async delete(id) {
        if (!id) {
            throw { status: 400, message: 'ID отдела обязателен' };
        }

        try {
            const [users] = await db.query('SELECT * FROM Users WHERE department_id = ?', [id]);
            if (users.length > 0) {
                throw { status: 400, message: 'Нельзя удалить отдел с привязанными пользователями' };
            }

            const [result] = await db.query('DELETE FROM Departments WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (err) {
            if (err.status) throw err; // Если есть код статуса, то бросаем исключение
            throw { status: 500, message: 'Ошибка при удалении отдела: ' + err.message };
        }
    }
}

export default Department;