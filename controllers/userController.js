import User from '../models/user.js';

/**
 * Получает список всех пользователей.
 *
 * @async
 * @function getAllUsers
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет список всех пользователей или сообщение об ошибке через HTTP-ответ.
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
};

/**
 * Получает пользователя по его ID.
 *
 * @async
 * @function getUserById
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID пользователя.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет объект пользователя или сообщение об ошибке через HTTP-ответ.
 */
export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
};

/**
 * Получает данные текущего аутентифицированного пользователя.
 *
 * @async
 * @function getMe
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.user - Данные пользователя из JWT-токена.
 * @param {string} req.user.id - ID текущего пользователя.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет объект пользователя или сообщение об ошибке через HTTP-ответ.
 */
export const getMe = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
};

/**
 * Получает список пользователей по ID отдела.
 *
 * @async
 * @function getUsersByDepartmentId
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID отдела.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет список пользователей или сообщение об ошибке через HTTP-ответ.
 */
export const getUsersByDepartmentId = async (req, res) => {
    const { id } = req.params;
    try {
        const users = await User.getUserByDepartmentId(id);
        console.log(users);
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
};

/**
 * Обновляет данные пользователя по его ID.
 *
 * @async
 * @function updateUser
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID пользователя для обновления.
 * @param {Object} req.body - Тело запроса с данными пользователя.
 * @param {string} [req.body.surname] - Новая фамилия пользователя (опционально).
 * @param {string} [req.body.name] - Новое имя пользователя (опционально).
 * @param {string} [req.body.patronymic] - Новое отчество пользователя (опционально).
 * @param {string} [req.body.role] - Новая роль пользователя (опционально).
 * @param {string} [req.body.department_id] - Новый ID отдела пользователя (опционально).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет обновленного пользователя или сообщение об ошибке через HTTP-ответ.
 */
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { surname, name, patronymic, role, department_id } = req.body;

    try {
        const updatedUser = await User.update(id, {
            surname: surname || null,
            name: name || null,
            patronymic: patronymic || null,
            role: role || null,
            department_id: department_id || null
        });
        res.status(200).json({ message: 'Пользователь успешно обновлен', user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
};

/**
 * Удаляет пользователя по его ID.
 *
 * @async
 * @function deleteUser
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.params - Параметры из URL.
 * @param {string} req.params.id - ID пользователя для удаления.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет сообщение об успешном удалении или ошибке через HTTP-ответ.
 */
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await User.delete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.status(200).json({ message: 'Пользователь успешно удален' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};