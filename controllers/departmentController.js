import Department from '../models/department.js';
import db from '../config/db.js';

export const createDepartment = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    try {
        const department = await Department.create({ name });
        res.status(201).json({ message: 'Department created successfully', department });
    } catch (err) {
        console.error('Error creating department:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, manager_id } = req.body;

    if (!name && !manager_id) {
        return res.status(400).json({ message: 'At least one field (name or manager_id) must be provided' });
    }

    try {
        const [existingDepartment] = await db.query('SELECT * FROM Departments WHERE id = ?', [id]);
        if (!existingDepartment.length) {
            return res.status(404).json({ message: 'Department not found' });
        }

        if (manager_id) {
            const [manager] = await db.query('SELECT * FROM Users WHERE id = ? AND role = "manager"', [manager_id]);
            if (!manager.length) {
                return res.status(400).json({ message: 'Invalid manager_id: must be a manager' });
            }

            const [existingAssignment] = await db.query(
                'SELECT * FROM Departments WHERE manager_id = ? AND id != ?',
                [manager_id, id]
            );
            if (existingAssignment.length) {
                return res.status(400).json({ message: 'Manager is already assigned to another department' });
            }
        }

        const department = await Department.update(id, { name, manager_id });
        res.status(200).json({ message: 'Department updated successfully', department });
    } catch (err) {
        console.error('Error updating department:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getDepartments = async (req, res) => {
    try {
        const departments = await Department.getAll();
        res.status(200).json(departments);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getDepartmentById = async (req, res) => {
    const { id } = req.params;

    try {
        const department = await Department.getById(id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json(department);
    } catch (err) {
        console.error('Error fetching department by id:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};