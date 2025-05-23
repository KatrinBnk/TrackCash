const Department = require('../models/department.js');

/**
 * Создаёт новый отдел с указанным названием и опциональным менеджером.
 *
 * @async
 * @function createDepartment
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя, создающего отдел (не используется в логике).
 * @param {Object} req.body - Тело запроса с данными отдела.
 * @param {string} req.body.name - Название нового отдела.
 * @param {string} [req.body.manager_id] - ID менеджера, привязанного к отделу (опционально).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет созданный отдел или сообщение об ошибке через HTTP-ответ.
 */
const createDepartment = async (req, res) => {
    const { name, manager_id } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Название отдела обязательно' });
    }

    try {
        const department = await Department.create({ name, manager_id });
        res.status(201).json({ message: 'Отдел успешно создан', department });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Обновляет существующий отдел по его ID.
 *
 * @async
 * @function updateDepartment
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID отдела для обновления.
 * @param {Object} req.body - Тело запроса с данными отдела.
 * @param {string} [req.body.name] - Новое название отдела (опционально).
 * @param {string} [req.body.manager_id] - Новый ID менеджера отдела (опционально).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет обновлённый отдел или сообщение об ошибке через HTTP-ответ.
 */
const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, manager_id } = req.body;

    if (!name && manager_id === undefined) {
        return res.status(400).json({ message: 'Необходимо указать хотя бы одно поле для обновления' });
    }

    try {
        const department = await Department.update(id, { name, manager_id });
        res.status(200).json({ message: 'Отдел успешно обновлён', department });
    } catch (err) {
        console.error('Ошибка обновления отдела:', err);
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Получает список всех отделов.
 *
 * @async
 * @function getDepartments
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя (используется для авторизации).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет список всех отделов или сообщение об ошибке через HTTP-ответ.
 */
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.getAll();
        res.status(200).json(departments);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Получает отдел по его ID.
 *
 * @async
 * @function getDepartmentById
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя (используется для авторизации).
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID отдела.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет объект отдела или сообщение об ошибке через HTTP-ответ.
 */
const getDepartmentById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID отдела обязателен' });
    }

    try {
        const department = await Department.getById(id);
        if (!department) {
            return res.status(404).json({ message: 'Отдел не найден' });
        }
        res.status(200).json(department);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Получает отдел по ID менеджера.
 *
 * @async
 * @function getDepartmentByManagerId
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя (используется как managerId).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет объект отдела или сообщение об ошибке через HTTP-ответ.
 */
const getDepartmentByManagerId = async (req, res) => {
    const managerId = req.user.id;

    try {
        const department = await Department.getByManagerId(managerId);
        if (!department) {
            return res.status(404).json({ message: 'Отдел для данного менеджера не найден' });
        }
        res.status(200).json(department);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Удаляет отдел по его ID, если к нему не привязаны пользователи.
 *
 * @async
 * @function deleteDepartment
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID пользователя (используется для авторизации).
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID отдела для удаления.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет HTTP-ответ с кодом 204 при успехе или ошибку.
 */
const deleteDepartment = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID отдела обязателен' });
    }

    try {
        const success = await Department.delete(id);
        if (!success) {
            return res.status(404).json({ message: 'Отдел не найден' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

module.exports = {
    createDepartment,
    updateDepartment,
    getDepartments,
    getDepartmentById,
    getDepartmentByManagerId,
    deleteDepartment
};