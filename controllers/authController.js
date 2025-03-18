import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
    const { username, password, surname, name, patronymic, role, department_id } = req.body;

    if (!username || !password || !surname || !name || !patronymic || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
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
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const user = await User.findByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const logout = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        // Перекладываю ответственность за удаление токена на клиента
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Error during logout:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};