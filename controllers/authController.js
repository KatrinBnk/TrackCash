import User from '../models/user.js';

export const register = async (req, res) => {
    const { username, password, role, department_id } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUser = await User.create({ username, password, role, department_id });
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
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: { id: user.id, username: user.username, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};