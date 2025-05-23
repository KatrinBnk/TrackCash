const db = require('../config/db.js');

class Transaction {
    /**
     * Создаёт новую транзакцию для сотрудника.
     *
     * @async
     * @function create
     * @param {Object} data - Данные для создания транзакции.
     * @param {string} data.userId - ID сотрудника, для которого создаётся транзакция.
     * @param {string} [data.categoryId] - ID категории транзакции (опционально).
     * @param {string} data.type - Тип транзакции ("income", "expense" или "balance").
     * @param {number} data.amount - Сумма транзакции.
     * @param {string} data.date - Дата транзакции (в формате, совместимом с базой данных).
     * @param {string} [data.comment] - Комментарий к транзакции (опционально).
     * @param {string} data.creatorId - ID пользователя, создающего транзакцию (сотрудник или менеджер).
     * @returns {Promise<Object>} - Возвращает объект созданной транзакции с полями id, userId, categoryId, type, amount, date, comment.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если создание невозможно.
     */
    static async create({ userId, categoryId, type, amount, date, comment, creatorId }) {
        if (!userId || !type || !amount || !date || !creatorId) {
            throw { status: 400, message: 'Обязательные поля: userId, type, amount, date, creatorId' };
        }

        try {
            const [userRows] = await db.query('SELECT * FROM Users WHERE id = ?', [userId]);
            const user = userRows[0];
            if (!user) {
                throw { status: 400, message: 'Пользователь с таким ID не существует' };
            }
            if (user.role !== 'employee') {
                throw { status: 400, message: 'Транзакции могут быть созданы только для сотрудников' };
            }
            const userDepartmentId = user.department_id;
            if (!userDepartmentId) {
                throw { status: 400, message: 'Сотрудник не привязан к отделу' };
            }

            const [creatorRows] = await db.query('SELECT * FROM Users WHERE id = ?', [creatorId]);
            const creator = creatorRows[0];
            if (!creator) {
                throw { status: 400, message: 'Создатель с таким ID не существует' };
            }

            if (type === 'balance') {
                if (creator.role !== 'manager' || creator.department_id !== userDepartmentId) {
                    throw { status: 403, message: 'Только менеджер отдела может устанавливать баланс для сотрудника' };
                }
            } else if (creatorId !== userId) {
                throw { status: 403, message: 'Только сам сотрудник может создавать свои транзакции доходов и расходов' };
            }

            if (categoryId) {
                const [categoryRows] = await db.query('SELECT * FROM Categories WHERE id = ?', [categoryId]);
                const category = categoryRows[0];
                if (!category) {
                    throw { status: 400, message: 'Категория с таким ID не существует' };
                }
                if (category.department_id !== userDepartmentId) {
                    throw { status: 400, message: 'Категория и сотрудник должны быть из одного отдела' };
                }
            }

            const [result] = await db.query(
                'INSERT INTO Transactions (user_id, category_id, type, amount, date, comment) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, categoryId || null, type, amount, date, comment || null]
            );
            return { id: result.insertId, userId, categoryId, type, amount, date, comment };
        } catch (err) {
            if (err.status) throw err;
            throw { status: 500, message: 'Ошибка при создании транзакции: ' + err.message };
        }
    }

    /**
     * Обновляет существующую транзакцию сотрудника по её ID.
     *
     * @async
     * @function update
     * @param {string} id - ID транзакции для обновления.
     * @param {Object} data - Данные для обновления транзакции.
     * @param {string} [data.category_id] - Новый ID категории (опционально).
     * @param {string} [data.type] - Новый тип транзакции ("income", "expense" или "balance") (опционально).
     * @param {number} [data.amount] - Новая сумма транзакции (опционально).
     * @param {string} [data.date] - Новая дата транзакции (опционально).
     * @param {string} [data.comment] - Новый комментарий (опционально).
     * @param {string} data.creatorId - ID пользователя, обновляющего транзакцию (сотрудник или менеджер).
     * @returns {Promise<Object>} - Возвращает объект обновлённой транзакции.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если обновление невозможно.
     */
    static async update(id, { category_id, type, amount, date, comment, creatorId }) {
        if (!id || !creatorId) {
            throw { status: 400, message: 'ID транзакции и creatorId обязательны' };
        }

        try {
            const [existingRows] = await db.query('SELECT * FROM Transactions WHERE id = ?', [id]);
            const existing = existingRows[0];
            if (!existing) {
                throw { status: 404, message: 'Транзакция не найдена' };
            }

            const [userRows] = await db.query('SELECT * FROM Users WHERE id = ?', [existing.user_id]);
            const user = userRows[0];
            if (!user) {
                throw { status: 400, message: 'Сотрудник транзакции не существует' };
            }
            if (user.role !== 'employee') {
                throw { status: 400, message: 'Транзакции могут быть только у сотрудников' };
            }
            const userDepartmentId = user.department_id;
            if (!userDepartmentId) {
                throw { status: 400, message: 'Сотрудник транзакции не привязан к отделу' };
            }

            const [creatorRows] = await db.query('SELECT * FROM Users WHERE id = ?', [creatorId]);
            const creator = creatorRows[0];
            if (!creator) {
                throw { status: 400, message: 'Создатель с таким ID не существует' };
            }

            if (type === 'balance' || existing.type === 'balance') {
                if (creator.role !== 'manager' || creator.department_id !== userDepartmentId) {
                    throw { status: 403, message: 'Только менеджер отдела может обновлять транзакции типа balance' };
                }
            } else if (creatorId !== existing.user_id) {
                throw { status: 403, message: 'Только сам сотрудник может обновлять свои транзакции доходов и расходов' };
            }


            if (category_id !== undefined && category_id) {
                const [categoryRows] = await db.query('SELECT * FROM Categories WHERE id = ?', [category_id]);
                const category = categoryRows[0];
                if (!category) {
                    throw { status: 400, message: 'Категория с таким ID не существует' };
                }
                if (category.department_id !== userDepartmentId) {
                    throw { status: 400, message: 'Категория и сотрудник должны быть из одного отдела' };
                }
            }

            const updates = [];
            const values = [];
            if (category_id !== undefined) {
                updates.push('category_id = ?');
                values.push(category_id || null);
            }
            if (type !== undefined) {
                updates.push('type = ?');
                values.push(type);
            }
            if (amount !== undefined) {
                updates.push('amount = ?');
                values.push(amount);
            }
            if (date !== undefined) {
                updates.push('date = ?');
                values.push(date);
            }
            if (comment !== undefined) {
                updates.push('comment = ?');
                values.push(comment || null);
            }


            if (updates.length === 0) {
                throw { status: 400, message: 'Не указано ни одно поле для обновления' };
            }

            values.push(id);
            await db.query(`UPDATE Transactions SET ${updates.join(', ')} WHERE id = ?`, values);

            const [updated] = await db.query('SELECT * FROM Transactions WHERE id = ?', [id]);
            return {
                ...updated[0],
                amount: parseFloat(updated[0].amount),
                date: new Date(updated[0].date).toISOString().split('T')[0]
            };
        } catch (err) {
            if (err.status) throw err;
            throw { status: 500, message: 'Ошибка при обновлении транзакции: ' + err.message };
        }
    }

    /**
     * Удаляет транзакцию по её ID, если инициатор является владельцем транзакции.
     *
     * @async
     * @function delete
     * @param {string} id - ID транзакции для удаления.
     * @param {string} creatorId - ID пользователя, инициирующего удаление (должен совпадать с user_id транзакции).
     * @returns {Promise<boolean>} - Возвращает true, если транзакция удалена, иначе false.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если удаление невозможно.
     */
    static async delete(id, creatorId) {
        if (!id || !creatorId) {
            throw { status: 400, message: 'ID транзакции и creatorId обязательны' };
        }

        try {
            const [existingRows] = await db.query('SELECT * FROM Transactions WHERE id = ?', [id]);
            const existing = existingRows[0];
            if (!existing) {
                throw { status: 404, message: 'Транзакция не найдена' };
            }

            if (existing.user_id !== creatorId) {
                throw { status: 403, message: 'Только владелец транзакции может её удалить' };
            }

            const [result] = await db.query('DELETE FROM Transactions WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (err) {
            if (err.status) throw err;
            throw { status: 500, message: 'Ошибка при удалении транзакции: ' + err.message };
        }
    }
}

module.exports = Transaction;