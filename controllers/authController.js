import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

/**
 * Регистрирует нового пользователя с указанными данными.
 *
 * @async
 * @function register
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.body - Тело запроса с данными пользователя.
 * @param {string} req.body.username - Уникальное имя пользователя.
 * @param {string} req.body.password - Пароль пользователя.
 * @param {string} req.body.surname - Фамилия пользователя.
 * @param {string} req.body.name - Имя пользователя.
 * @param {string} req.body.patronymic - Отчество пользователя.
 * @param {string} req.body.role - Роль пользователя (например, 'admin', 'manager', 'employee').
 * @param {string} [req.body.department_id] - ID отдела, к которому привязан пользователь (опционально).
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет созданного пользователя или сообщение об ошибке через HTTP-ответ.
 */
export const register = async (req, res) => {
    const { username, password, surname, name, patronymic, role, department_id } = req.body;

    if (!username || !password || !surname || !name || !patronymic || !role) {
        return res.status(400).json({ message: 'Для регистрации пользователя все поля обязательны' });
    }

    try {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким username уже зарегистрирован' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = await User.create({
            username,
            password: hashedPassword,
            surname,
            name,
            patronymic,
            role,
            department_id
        });
        res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user: newUser });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Аутентифицирует пользователя и выдает JWT-токен.
 *
 * @async
 * @function login
 * @param {Object} req - Объект запроса Express.
 * @param {Object} req.body - Тело запроса с данными для входа.
 * @param {string} req.body.username - Имя пользователя.
 * @param {string} req.body.password - Пароль пользователя.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет токен и данные пользователя или сообщение об ошибке через HTTP-ответ.
 */
export const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username и пароль обязательны' });
    }

    try {
        const user = await User.findByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Некорректный username или пароль' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            maxAge: 3600000 // 1 час в миллисекундах
        });

        res.status(200).json({
            message: 'Авторизация пройдена успешно',
            token,
            user: { id: user.id, username: user.username, role: user.role },
        });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

/**
 * Выполняет выход пользователя из системы, очищая cookie с токеном.
 *
 * @async
 * @function logout
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @returns {Promise<void>} - Отправляет подтверждение выхода или сообщение об ошибке через HTTP-ответ.
 */
export let logout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'Выход из системы выполнен успешно' });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};