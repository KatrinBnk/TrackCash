import db from '../config/db.js';

class Category {
    /**
     * Проверяет права менеджера и возвращает данные его отдела.
     *
     * @async
     * @private
     * @param {string} managerId - ID менеджера для проверки.
     * @param {boolean} [checkManagerRole=true] - Проверять, является ли менеджер руководителем отдела (опционально).
     * @returns {Promise<Object>} - Объект с данными отдела менеджера.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если проверки не пройдены.
     */
    static async checkManagerPermissions(managerId, checkManagerRole = true) {
        const [managerRows] = await db.query('SELECT * FROM Users WHERE id = ?', [managerId]);
        const manager = managerRows[0];
        if (!manager) throw { status: 404, message: 'Менеджер не найден' };
        if (manager.role !== 'manager') throw { status: 400, message: 'Неверная роль пользователя' };
        if (!manager.department_id) throw { status: 400, message: 'Менеджер не привязан к отделу' };

        const [departmentRows] = await db.query('SELECT * FROM Departments WHERE id = ?', [manager.department_id]);
        const department = departmentRows[0];
        if (!department) throw { status: 404, message: 'Отдел не найден' };
        if (checkManagerRole && department.manager_id !== managerId) {
            throw { status: 400, message: 'Менеджер не управляет отделом, к которому привязана категория' };
        }

        return department;
    }

    /**
     * Создаёт новую категорию в отделе менеджера, если она ещё не существует.
     *
     * @async
     * @function create
     * @param {string} creatorId - ID менеджера, создающего категорию.
     * @param {Object} data - Данные для создания категории.
     * @param {string} data.name - Название новой категории.
     * @returns {Promise<Object>} - Возвращает объект созданной категории с полями id, name и department_id.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если создание невозможно.
     */
    static async create(creatorId, { name }) {
        const department = await this.checkManagerPermissions(creatorId, false); // Не проверяем manager_id
        const departmentId = department.id;

        const [existingCategoryRows] = await db.query(
            'SELECT * FROM Categories WHERE name = ? AND department_id = ?',
            [name, departmentId]
        );
        if (existingCategoryRows[0]) {
            throw { status: 400, message: 'Категория с таким названием уже существует в указанном отделе' };
        }

        const [result] = await db.query(
            'INSERT INTO Categories (name, department_id) VALUES (?, ?)',
            [name, departmentId]
        );
        return { id: result.insertId, name, department_id: departmentId };
    }

    /**
     * Получает список категорий для отдела пользователя с опциональной фильтрацией по имени.
     *
     * @async
     * @function getCategories
     * @param {string} userId - ID пользователя, запрашивающего категории.
     * @param {string} [name=''] - Необязательный фильтр по имени категории (регистронезависимый поиск).
     * @returns {Promise<Object[]>} - Возвращает массив объектов категорий, соответствующих отделу пользователя.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если запрос невозможен.
     */
    static async getCategories(userId, name = '') {
        const [userRows] = await db.query('SELECT role, department_id FROM Users WHERE id = ?', [userId]);
        const user = userRows[0];
        if (!user) throw { status: 400, message: 'Пользователь с таким ID не существует' };
        if (user.role !== 'manager' && user.role !== 'employee') {
            throw { status: 400, message: 'Неверная роль пользователя' };
        }

        const { department_id: departmentId } = user;
        if (departmentId === null) {
            throw { status: 400, message: 'Пользователь не привязан к отделу' };
        }

        let query = 'SELECT * FROM Categories WHERE department_id = ?';
        const params = [departmentId];
        if (name) {
            query += ' AND LOWER(name) LIKE LOWER(?)';
            params.push(`%${name}%`);
        }

        const [categories] = await db.query(query, params);
        return categories;
    }

    /**
     * Обновляет название категории, если менеджер имеет на это права.
     *
     * @async
     * @function update
     * @param {string} managerId - ID менеджера, выполняющего обновление.
     * @param {Object} data - Данные для обновления категории.
     * @param {string} data.name - Новое название категории.
     * @param {number} data.categoryId - ID категории для обновления.
     * @returns {Promise<Object>} - Возвращает объект обновлённой категории из базы данных.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если обновление невозможно.
     */
    static async update(managerId, { name, categoryId }) {
        await this.checkManagerPermissions(managerId); // Проверяем права менеджера

        const [categoryRows] = await db.query('SELECT * FROM Categories WHERE id = ?', [categoryId]);
        const category = categoryRows[0];
        if (!category) throw { status: 404, message: 'Категория не найдена' };

        await db.query('UPDATE Categories SET name = ? WHERE id = ?', [name, categoryId]);
        const [updatedRows] = await db.query('SELECT * FROM Categories WHERE id = ?', [categoryId]);
        return updatedRows[0];
    }

    /**
     * Удаляет категорию, если она не связана с транзакциями и менеджер имеет на это права.
     *
     * @async
     * @function delete
     * @param {string} managerId - ID менеджера, выполняющего удаление.
     * @param {string} categoryId - ID категории для удаления.
     * @returns {Promise<boolean>} - Возвращает true, если категория успешно удалена, иначе false.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если удаление невозможно.
     */
    static async delete(managerId, categoryId) {
        await this.checkManagerPermissions(managerId); // Проверяем права менеджера

        const [categoryRows] = await db.query('SELECT * FROM Categories WHERE id = ?', [categoryId]);
        const category = categoryRows[0];
        if (!category) throw { status: 404, message: 'Категория не найдена' };

        const [transactionsRows] = await db.query('SELECT * FROM Transactions WHERE category_id = ?', [categoryId]);
        if (transactionsRows[0]) throw { status: 400, message: 'Нельзя удалить категорию с транзакциями' };

        const [result] = await db.query('DELETE FROM Categories WHERE id = ?', [categoryId]);
        return result.affectedRows > 0;
    }
}

export default Category;