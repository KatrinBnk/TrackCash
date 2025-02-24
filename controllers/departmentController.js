import Department from '../models/department.js';
import db from "../config/db.js";

export const createDepartment = async (req, res) => {
    const { name, manager_id } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    if (manager_id) {
        const [manager] = await db.query('SELECT * FROM Users WHERE id = ? AND role = "manager"', [manager_id]);
        if (!manager.length) {
            return res.status(400).json({ message: 'Invalid manager_id: must be a manager' });
        }
    }

    try {
        const department = await Department.create({ name, manager_id });
        res.status(201).json({ message: 'Department created successfully', department });
    } catch (err) {
        console.error('Error creating department:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};