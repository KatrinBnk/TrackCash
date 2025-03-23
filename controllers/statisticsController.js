import Statistics from '../models/statistics.js';

/**
 * Получает общую статистику транзакций (суммы) для пользователя.
 *
 * @async
 * @function getSummaryStatistics
 * @param {import('express').Request} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя, запрашивающего статистику.
 * @param {Object} req.query - Параметры запроса.
 * @param {string} [req.query.departmentId] - ID отдела для фильтрации (для менеджеров).
 * @param {string|string[]} [req.query.userIds] - ID сотрудника или массив ID сотрудников для фильтрации (для менеджеров).
 * @param {string} [req.query.startDate] - Начальная дата периода (формат YYYY-MM-DD).
 * @param {string} [req.query.endDate] - Конечная дата периода (формат YYYY-MM-DD).
 * @param {string|string[]} [req.query.categoryIds] - ID категории или массив ID категорий для фильтрации.
 * @param {string|string[]} [req.query.transactionTypes] - Тип транзакции или массив типов ("income", "expense", "balance") для фильтрации.
 * @param {"json"|"csv"} [req.query.format] - Формат ответа ("json" или "csv", по умолчанию "json").
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет статистику в формате JSON или CSV через HTTP-ответ.
 */
export const getSummaryStatistics = async (req, res) => {
    const creatorId = req.user.id;
    const {
        departmentId,
        userIds,
        startDate,
        endDate,
        categoryIds,
        transactionTypes,
        format = 'json' // По умолчанию JSON, можно указать 'csv'
    } = req.query;

    try {
        const params = {
            creatorId,
            departmentId: departmentId || undefined,
            userIds: userIds ? (Array.isArray(userIds) ? userIds : [userIds]) : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            categoryIds: categoryIds ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds]) : undefined,
            transactionTypes: transactionTypes ? (Array.isArray(transactionTypes) ? transactionTypes : [transactionTypes]) : undefined
        };

        const stats = await Statistics.getSummaryStatistics(params);

        if (format === 'csv') {
            const csv = Statistics.exportSummaryToCSV(stats);
            res.header('Content-Type', 'text/csv');
            res.attachment('summary_statistics.csv');
            return res.send(csv);
        }

        res.status(200).json(stats);
    } catch (err) {
        console.error('Ошибка при получении общей статистики:', err);
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Получает детализированную статистику транзакций (список транзакций) для пользователя.
 *
 * @async
 * @function getDetailedStatistics
 * @param {import('express').Request} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя, запрашивающего статистику.
 * @param {Object} req.query - Параметры запроса.
 * @param {string} [req.query.departmentId] - ID отдела для фильтрации (для менеджеров).
 * @param {string|string[]} [req.query.userIds] - ID сотрудника или массив ID сотрудников для фильтрации (для менеджеров).
 * @param {string} [req.query.startDate] - Начальная дата периода (формат YYYY-MM-DD).
 * @param {string} [req.query.endDate] - Конечная дата периода (формат YYYY-MM-DD).
 * @param {string|string[]} [req.query.categoryIds] - ID категории или массив ID категорий для фильтрации.
 * @param {string|string[]} [req.query.transactionTypes] - Тип транзакции или массив типов ("income", "expense", "balance") для фильтрации.
 * @param {"json"|"csv"} [req.query.format] - Формат ответа ("json" или "csv", по умолчанию "json").
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет статистику в формате JSON или CSV через HTTP-ответ.
 */
export const getDetailedStatistics = async (req, res) => {
    const creatorId = req.user.id;
    const {
        departmentId,
        userIds,
        startDate,
        endDate,
        categoryIds,
        transactionTypes,
        format = 'json' // По умолчанию JSON, можно указать 'csv'
    } = req.query;

    try {
        const params = {
            creatorId,
            departmentId: departmentId || undefined,
            userIds: userIds ? (Array.isArray(userIds) ? userIds : [userIds]) : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            categoryIds: categoryIds ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds]) : undefined,
            transactionTypes: transactionTypes ? (Array.isArray(transactionTypes) ? transactionTypes : [transactionTypes]) : undefined
        };

        const stats = await Statistics.getDetailedStatistics(params);

        console.log(stats)

        if (format === 'csv') {
            const csv = Statistics.exportDetailedToCSV(stats);
            res.header('Content-Type', 'text/csv');
            res.attachment('detailed_statistics.csv');
            return res.send(csv);
        }

        res.status(200).json(stats);
    } catch (err) {
        console.error('Ошибка при получении детализированной статистики:', err);
        res.status(err.status || 500).json({ message: err.message });
    }
};