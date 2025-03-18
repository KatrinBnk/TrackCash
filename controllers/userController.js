import User from '../models/user.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll()
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
}

export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { surname, name, patronymic, role, department_id } = req.body;

    try {
        const updatedUser = await User.update(id,
            {
                surname: surname || null,
                name: name || null,
                patronymic: patronymic || null,
                role: role || null,
                department_id: department_id || null
            });
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: err.message });
    }
}

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await User.delete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}