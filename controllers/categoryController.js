const Category = require('../models/category.js');

/**
 * Создаёт новую категорию в отделе менеджера.
 *
 * @async
 * @function createCategory
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID менеджера, создающего категорию.
 * @param {Object} req.body - Тело запроса с данными категории.
 * @param {string} req.body.name - Название новой категории.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет созданную категорию или сообщение об ошибке через HTTP-ответ.
 */
const createCategory = async (req, res) => {
    const managerId = req.user.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Имя категории обязательно' });
    }

    try {
        const category = await Category.create(managerId, { name });
        res.status(201).json({ message: 'Категория успешно создана', category });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Получает список категорий для отдела пользователя с опциональной фильтрацией по имени.
 *
 * @async
 * @function getCategories
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя.
 * @param {Object} req.query - Параметры запроса из строки URL.
 * @param {string} [req.query.name] - Необязательное имя категории для фильтрации.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет список категорий или сообщение об ошибке через HTTP-ответ.
 */
const getCategories = async (req, res) => {
    const userId = req.user.id;
    const categoryName = req.query.name;

    try {
        const categories = await Category.getCategories(userId, categoryName);
        res.status(200).json(categories);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Обновляет категорию по её ID, если менеджер имеет права.
 *
 * @async
 * @function updateCategory
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID менеджера, выполняющего обновление.
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID категории для обновления.
 * @param {Object} req.body - Тело запроса с данными категории.
 * @param {string} req.body.name - Новое название категории.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет обновлённую категорию или сообщение об ошибке через HTTP-ответ.
 */
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const managerId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Наименование категории обязательно' });
    }

    try {
        const updatedCategory = await Category.update(managerId, { name, categoryId: id });
        res.status(200).json({ message: 'Категория успешно обновлена', category: updatedCategory });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Удаляет категорию по её ID, если менеджер имеет на это права.
 *
 * @async
 * @function deleteCategory
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID менеджера, выполняющего удаление.
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.categoryId - ID категории для удаления.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет HTTP-ответ с кодом 204 при успехе или ошибку.
 */
const deleteCategory = async (req, res) => {
    const managerId = req.user.id;
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID категории обязателен' });
    }

    try {
        await Category.delete(managerId, id);
        res.status(204).send();
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};