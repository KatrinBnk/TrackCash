const Transaction = require('../models/transaction.js');

/**
 * Добавляет новую транзакцию для сотрудника.
 *
 * @async
 * @function addTransaction
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя, инициирующего создание (creatorId).
 * @param {Object} req.body - Тело запроса с данными транзакции.
 * @param {string} req.body.userId - ID сотрудника, для которого создаётся транзакция.
 * @param {string} [req.body.categoryId] - ID категории транзакции (опционально).
 * @param {string} req.body.type - Тип транзакции ("income", "expense" или "balance").
 * @param {number} req.body.amount - Сумма транзакции.
 * @param {string} req.body.date - Дата транзакции.
 * @param {string} [req.body.comment] - Комментарий к транзакции (опционально).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет созданную транзакцию или сообщение об ошибке через HTTP-ответ.
 */
const addTransaction = async (req, res) => {
    const creatorId = req.user.id;
    const { userId, categoryId, type, amount, date, comment } = req.body;

    try {
        const transaction = await Transaction.create({
            userId,
            categoryId,
            type,
            amount,
            date,
            comment,
            creatorId
        });
        res.status(201).json({ message: 'Транзакция успешно добавлена', transaction });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Обновляет существующую транзакцию сотрудника.
 *
 * @async
 * @function updateTransaction
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя, инициирующего обновление (creatorId).
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID транзакции для обновления.
 * @param {Object} req.body - Тело запроса с данными транзакции.
 * @param {string} [req.body.category_id] - Новый ID категории (опционально).
 * @param {string} [req.body.type] - Новый тип транзакции ("income", "expense" или "balance") (опционально).
 * @param {number} [req.body.amount] - Новая сумма транзакции (опционально).
 * @param {string} [req.body.date] - Новая дата транзакции (опционально).
 * @param {string} [req.body.comment] - Новый комментарий (опционально).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет обновлённую транзакцию или сообщение об ошибке через HTTP-ответ.
 */
const updateTransaction = async (req, res) => {
    const creatorId = req.user.id;
    const { id } = req.params;
    const { categoryId, type, amount, date, comment } = req.body;

    try {
        const updatedTransaction = await Transaction.update(id, {
            category_id: categoryId,
            type,
            amount,
            date,
            comment,
            creatorId
        });
        res.status(200).json({ message: 'Транзакция успешно обновлена', transaction: updatedTransaction });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Удаляет транзакцию сотрудника, если инициатор является её владельцем.
 *
 * @async
 * @function deleteTransaction
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя, инициирующего удаление (creatorId).
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID транзакции для удаления.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет HTTP-ответ с кодом 204 при успехе или ошибку.
 */
const deleteTransaction = async (req, res) => {
    const creatorId = req.user.id;
    const { id } = req.params;

    try {
        const success = await Transaction.delete(id, creatorId);
        if (!success) {
            return res.status(404).json({ message: 'Транзакция не найдена' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

module.exports = {
    addTransaction,
    updateTransaction,
    deleteTransaction
};