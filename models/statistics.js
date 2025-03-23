import db from '../config/db.js';
import { parse } from 'json2csv';

class Statistics {
    /**
     * Проверяет права доступа и формирует базовые условия фильтрации по пользователям.
     *
     * @private
     * @async
     * @function restrictAccess
     * @param {string} creatorId - ID пользователя, запрашивающего статистику.
     * @param {string} [departmentId] - ID отдела (для менеджеров).
     * @param {string[]} [userIds] - Массив ID сотрудников (для менеджеров).
     * @returns {Promise<{ conditions: string[], values: any[] }>} - Условия и значения для SQL-запроса.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если доступ невозможен.
     */
    static async restrictAccess(creatorId, departmentId, userIds) {
        const conditions = [];
        const values = [];

        const [creatorRows] = await db.query('SELECT role, department_id FROM Users WHERE id = ?', [creatorId]);
        const creator = creatorRows[0];
        if (!creator) {
            throw { status: 400, message: 'Пользователь с таким ID не существует' };
        }

        if (creator.role === 'employee') {
            conditions.push('t.user_id = ?');
            values.push(creatorId);
        } else if (creator.role === 'manager') {
            if (!creator.department_id) {
                throw { status: 400, message: 'Менеджер не привязан к отделу' };
            }
            if (departmentId && userIds) {
                throw { status: 400, message: 'Укажите либо departmentId, либо userIds, но не оба' };
            }
            if (departmentId) {
                if (departmentId !== creator.department_id) {
                    throw { status: 403, message: 'Менеджер может запрашивать статистику только своего отдела' };
                }
                conditions.push('u.department_id = ?');
                values.push(departmentId);
            } else if (userIds && userIds.length > 0) {
                const [users] = await db.query(
                    'SELECT id FROM Users WHERE id IN (?) AND department_id = ? AND role = "employee"',
                    [userIds, creator.department_id]
                );
                if (users.length !== userIds.length) {
                    throw { status: 400, message: 'Некоторые пользователи не принадлежат вашему отделу или не являются сотрудниками' };
                }
                conditions.push('t.user_id IN (?)');
                values.push(userIds);
            } else {
                conditions.push('u.department_id = ?');
                values.push(creator.department_id);
            }
        } else {
            throw { status: 403, message: 'Доступ запрещён: неизвестная роль пользователя' };
        }

        return { conditions, values };
    }

    /**
     * Формирует условия фильтрации на основе параметров.
     *
     * @private
     * @function buildFilterConditions
     * @param {Object} params - Параметры фильтрации.
     * @param {string} [params.startDate] - Начальная дата периода.
     * @param {string} [params.endDate] - Конечная дата периода.
     * @param {string[]} [params.categoryIds] - Массив ID категорий.
     * @param {string[]} [params.transactionTypes] - Массив типов транзакций.
     * @returns {{ conditions: string[], values: any[] }} - Условия и значения для SQL-запроса.
     * @throws {Object} - Ошибка с кодом статуса, если типы транзакций недопустимы.
     */
    static buildFilterConditions({ startDate, endDate, categoryIds, transactionTypes }) {
        const conditions = [];
        const values = [];

        if (startDate) {
            conditions.push('t.date >= ?');
            values.push(startDate);
        }
        if (endDate) {
            conditions.push('t.date <= ?');
            values.push(endDate);
        }
        if (categoryIds && categoryIds.length > 0) {
            conditions.push('t.category_id IN (?)');
            values.push(categoryIds);
        }
        console.log(transactionTypes)
        if (transactionTypes) {
            let typesArray = transactionTypes[0];
            typesArray = typesArray.split(',').map(type => type.trim()).filter(type => type);


            if (typesArray.length > 0) {
                const validTypes = ['income', 'expense', 'balance'];
                if (!typesArray.every(type => validTypes.includes(type))) {
                    throw { status: 400, message: 'Недопустимый тип транзакции. Используйте "income", "expense" или "balance"' };
                }
                conditions.push('t.type IN (?)');
                values.push(typesArray);
            }
        }

        return { conditions, values };
    }

    /**
     * Получает общую статистику транзакций (суммы) на основе параметров.
     *
     * @async
     * @function getSummaryStatistics
     * @param {Object} params - Параметры для формирования статистики.
     * @param {string} params.creatorId - ID пользователя, запрашивающего статистику (сотрудник или менеджер).
     * @param {string} [params.departmentId] - ID отдела (для менеджеров, опционально).
     * @param {string[]} [params.userIds] - Массив ID сотрудников (для менеджеров, опционально).
     * @param {string} [params.startDate] - Начальная дата периода (опционально, формат YYYY-MM-DD).
     * @param {string} [params.endDate] - Конечная дата периода (опционально, формат YYYY-MM-DD).
     * @param {string[]} [params.categoryIds] - Массив ID категорий для фильтрации (опционально).
     * @param {string[]} [params.transactionTypes] - Массив типов транзакций для фильтрации ("income", "expense", "balance") (опционально).
     * @returns {Promise<Object>} - Объект с суммами доходов, расходов и баланса.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если запрос невозможен.
     */
    static async getSummaryStatistics({ creatorId, departmentId, userIds, startDate, endDate, categoryIds, transactionTypes }) {
        if (!creatorId) {
            throw { status: 400, message: 'ID пользователя (creatorId) обязателен' };
        }

        try {
            // Проверка прав доступа
            const { conditions: accessConditions, values: accessValues } = await this.restrictAccess(creatorId, departmentId, userIds);

            // Фильтры
            const { conditions: filterConditions, values: filterValues } = this.buildFilterConditions({
                startDate,
                endDate,
                categoryIds,
                transactionTypes
            });

            const conditions = [...accessConditions, ...filterConditions];
            const values = [...accessValues, ...filterValues];

            let query = `
                SELECT 
                    t.user_id,
                    u.surname,
                    u.name,
                    u.patronymic,
                    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
                    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense,
                    SUM(CASE WHEN t.type = 'balance' THEN t.amount ELSE 0 END) as balance
                FROM Transactions t
                JOIN Users u ON t.user_id = u.id
            `;
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            query += ' GROUP BY t.user_id, u.surname, u.name, u.patronymic';

            const [stats] = await db.query(query, values);

            const result = {
                byUser: stats.map(row => ({
                    userId: row.user_id,
                    surname: row.surname,
                    name: row.name,
                    patronymic: row.patronymic,
                    income: parseFloat(row.income) || 0,
                    expense: parseFloat(row.expense) || 0,
                    balance: parseFloat(row.balance) || 0,
                    total: (parseFloat(row.income) || 0) + (parseFloat(row.balance) || 0) - (parseFloat(row.expense) || 0)
                })),
                total: {
                    income: stats.reduce((sum, row) => sum + (parseFloat(row.income) || 0), 0),
                    expense: stats.reduce((sum, row) => sum + (parseFloat(row.expense) || 0), 0),
                    balance: stats.reduce((sum, row) => sum + (parseFloat(row.balance) || 0), 0),
                    total: stats.reduce((sum, row) => sum + (parseFloat(row.income) || 0) + (parseFloat(row.balance) || 0) - (parseFloat(row.expense) || 0), 0)
                }
            };

            return result;
        } catch (err) {
            if (err.status) throw err;
            throw { status: 500, message: 'Ошибка при получении общей статистики: ' + err.message };
        }
    }

    /**
     * Получает детализированную статистику (список транзакций) на основе параметров.
     *
     * @async
     * @function getDetailedStatistics
     * @param {Object} params - Параметры для формирования статистики.
     * @param {string} params.creatorId - ID пользователя, запрашивающего статистику (сотрудник или менеджер).
     * @param {string} [params.departmentId] - ID отдела (для менеджеров, опционально).
     * @param {string[]} [params.userIds] - Массив ID сотрудников (для менеджеров, опционально).
     * @param {string} [params.startDate] - Начальная дата периода (опционально, формат YYYY-MM-DD).
     * @param {string} [params.endDate] - Конечная дата периода (опционально, формат YYYY-MM-DD).
     * @param {string[]} [params.categoryIds] - Массив ID категорий для фильтрации (опционально).
     * @param {string[]} [params.transactionTypes] - Массив типов транзакций для фильтрации ("income", "expense", "balance") (опционально).
     * @returns {Promise<Object>} - Объект с детализированным списком транзакций.
     * @throws {Object} - Ошибка с кодом статуса и сообщением, если запрос невозможен.
     */
    static async getDetailedStatistics({ creatorId, departmentId, userIds, startDate, endDate, categoryIds, transactionTypes }) {
        if (!creatorId) {
            throw { status: 400, message: 'ID пользователя (creatorId) обязателен' };
        }

        try {
            // Проверка прав доступа
            const { conditions: accessConditions, values: accessValues } = await this.restrictAccess(creatorId, departmentId, userIds);

            // Фильтры
            const { conditions: filterConditions, values: filterValues } = this.buildFilterConditions({
                startDate,
                endDate,
                categoryIds,
                transactionTypes
            });

            const conditions = [...accessConditions, ...filterConditions];
            const values = [...accessValues, ...filterValues];

            let query = `
                SELECT 
                    t.id,
                    t.user_id,
                    u.surname,
                    u.name,
                    u.patronymic,
                    t.category_id,
                    c.name as category_name,
                    t.type,
                    t.amount,
                    t.date,
                    t.comment,
                    u.department_id
                FROM Transactions t
                JOIN Users u ON t.user_id = u.id
                LEFT JOIN Categories c ON t.category_id = c.id
            `;
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            query += ' ORDER BY t.date ASC';

            const [transactions] = await db.query(query, values);

            const result = {
                transactions: transactions.map(t => ({
                    id: t.id,
                    userId: t.user_id,
                    surname: t.surname,
                    name: t.name,
                    patronymic: t.patronymic,
                    categoryId: t.category_id,
                    categoryName: t.category_name || null,
                    type: t.type,
                    amount: parseFloat(t.amount),
                    date: new Date(t.date).toISOString().split('T')[0],
                    comment: t.comment || null,
                    departmentId: t.department_id
                })),
                summary: {
                    income: transactions.reduce((sum, t) => sum + (t.type === 'income' ? parseFloat(t.amount) : 0), 0),
                    expense: transactions.reduce((sum, t) => sum + (t.type === 'expense' ? parseFloat(t.amount) : 0), 0),
                    balance: transactions.reduce((sum, t) => sum + (t.type === 'balance' ? parseFloat(t.amount) : 0), 0),
                    total: transactions.reduce((sum, t) => sum + (t.type === 'income' || t.type === 'balance' ? parseFloat(t.amount) : 0), 0) -
                        transactions.reduce((sum, t) => sum + (t.type === 'expense' ? parseFloat(t.amount) : 0), 0)
                }
            };

            return result;
        } catch (err) {
            if (err.status) throw err;
            throw { status: 500, message: 'Ошибка при получении детализированной статистики: ' + err.message };
        }
    }

    /**
     * Экспортирует общую статистику в CSV.
     *
     * @function exportSummaryToCSV
     * @param {Object} stats - Объект общей статистики из getSummaryStatistics.
     * @returns {string} - CSV-строка с данными статистики.
     */
    static exportSummaryToCSV(stats) {
        const fields = [
            { label: 'User ID', value: 'userId' },
            { label: 'Surname', value: 'surname' },
            { label: 'Name', value: 'name' },
            { label: 'Patronymic', value: 'patronymic' },
            { label: 'Income', value: 'income' },
            { label: 'Expense', value: 'expense' },
            { label: 'Balance', value: 'balance' },
            { label: 'Total', value: 'total' }
        ];
        const csvData = stats.byUser;
        return parse(csvData, { fields });
    }

    /**
     * Экспортирует детализированную статистику в CSV.
     *
     * @function exportDetailedToCSV
     * @param {Object} stats - Объект детализированной статистики из getDetailedStatistics.
     * @returns {string} - CSV-строка с данными транзакций.
     */
    static exportDetailedToCSV(stats) {
        const fields = [
            { label: 'Transaction ID', value: 'id' },
            { label: 'User ID', value: 'userId' },
            { label: 'Surname', value: 'surname' },
            { label: 'Name', value: 'name' },
            { label: 'Patronymic', value: 'patronymic' },
            { label: 'Category ID', value: 'categoryId' },
            { label: 'Category Name', value: 'categoryName' },
            { label: 'Type', value: 'type' },
            { label: 'Amount', value: 'amount' },
            { label: 'Date', value: 'date' },
            { label: 'Comment', value: 'comment' },
            { label: 'Department ID', value: 'departmentId' }
        ];
        const csvData = stats.transactions;
        return parse(csvData, { fields });
    }
}

export default Statistics;