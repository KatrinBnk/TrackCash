const db = require('../config/db.js');

class User {
    /**
     * Находит пользователя по имени пользователя.
     *
     * @async
     * @function findByUsername
     * @param {string} username - Имя пользователя для поиска.
     * @returns {Promise<Object|null>} - Возвращает объект пользователя или null, если пользователь не найден.
     */
    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        return rows[0];
    }

    /**
     * Находит пользователя по его ID.
     *
     * @async
     * @function findById
     * @param {string} id - ID пользователя для поиска.
     * @returns {Promise<Object|null>} - Возвращает объект пользователя или null, если пользователь не найден.
     */
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM Users WHERE id = ?', [id]);
        return rows[0];
    }

    /**
     * Получает список всех пользователей.
     *
     * @async
     * @function findAll
     * @returns {Promise<Object[]>} - Возвращает массив объектов пользователей.
     */
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM Users');
        return rows;
    }

    /**
     * Получает список пользователей по ID отдела с ролью "employee".
     *
     * @async
     * @function getUserByDepartmentId
     * @param {string} department_id - ID отдела для поиска пользователей.
     * @returns {Promise<Object[]>} - Возвращает массив объектов пользователей.
     */
    static async getUserByDepartmentId(department_id) {
        const [rows] = await db.query('SELECT * FROM Users WHERE department_id = ? AND role = "employee"', [department_id]);
        return rows;
    }

    /**
     * Удаляет пользователя по его ID с проверкой на привязку к отделу.
     *
     * @async
     * @function delete
     * @param {string} id - ID пользователя для удаления.
     * @returns {Promise<boolean>} - Возвращает true, если пользователь удален, иначе выбрасывает ошибку.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если пользователь не найден или является менеджером отдела.
     */
    static async delete(id) {
        const [user] = await db.query('SELECT * FROM Users WHERE id = ?', [id]);
        if (!user.length) {
            throw { status: 404, message: 'Пользователь не найден' };
        }
        if (user[0].role === 'manager' && user[0].department_id) {
            throw { status: 400, message: `Менеджер привязан к отделу ${user[0].department_id}, его удаление невозможно` };
        }

        const [result] = await db.query('DELETE FROM Users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    /**
     * Обновляет данные пользователя по его ID с учетом логики привязки к отделам.
     *
     * @async
     * @function update
     * @param {string} id - ID пользователя для обновления.
     * @param {Object} [data] - Объект с данными для обновления.
     * @param {string} [data.surname] - Новая фамилия пользователя (опционально).
     * @param {string} [data.name] - Новое имя пользователя (опционально).
     * @param {string} [data.patronymic] - Новое отчество пользователя (опционально).
     * @param {string} [data.department_id] - Новый ID отдела пользователя (опционально, может быть null).
     * @returns {Promise<Object|null>} - Возвращает обновленного пользователя или null, если ничего не обновлено.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если пользователь или отдел не найдены, или есть конфликт менеджеров.
     */
    static async update(id, { surname, name, patronymic, department_id } = {}) {
        const updates = [];
        const values = [];

        // Проверка существования пользователя
        if (await this.findById(id) === null) {
            throw { status: 404, message: 'Пользователь не найден' };
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
                    throw { status: 400, message: 'Отдела с таким идентификатором не существует' };
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

    /**
     * Создает нового пользователя в базе данных.
     *
     * @async
     * @function create
     * @param {Object} data - Объект с данными нового пользователя.
     * @param {string} data.username - Уникальное имя пользователя.
     * @param {string} data.password - Хэшированный пароль пользователя.
     * @param {string} data.surname - Фамилия пользователя.
     * @param {string} data.name - Имя пользователя.
     * @param {string} data.patronymic - Отчество пользователя.
     * @param {string} data.role - Роль пользователя (например, 'admin', 'manager', 'employee').
     * @param {string} [data.department_id] - ID отдела пользователя (опционально).
     * @returns {Promise<Object>} - Возвращает созданного пользователя с его ID и основными данными.
     */
    static async create({ username, password, surname, name, patronymic, role, department_id }) {
        // Если пользователь — менеджер и указан department_id, проверяем отдел
        if (role === 'manager' && department_id) {
            const [department] = await db.query('SELECT * FROM Departments WHERE id = ?', [department_id]);
            if (!department.length) {
                throw { status: 400, message: 'Отдела с таким идентификатором не существует' };
            }
            if (department[0].manager_id) {
                throw { status: 400, message: 'В указанном отделе уже есть менеджер' };
            }
        }

        // Создаём пользователя
        const [result] = await db.query(
            'INSERT INTO Users (username, password, surname, name, patronymic, role, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, password, surname, name, patronymic, role, department_id || null]
        );

        const newUserId = result.insertId;

        // Если пользователь — менеджер, обновляем таблицу Departments
        if (role === 'manager' && department_id) {
            await db.query(
                'UPDATE Departments SET manager_id = ? WHERE id = ?',
                [newUserId, department_id]
            );
        }

        return {
            id: newUserId,
            username,
            surname,
            name,
            patronymic,
            role
        };
    }
}

module.exports = User;