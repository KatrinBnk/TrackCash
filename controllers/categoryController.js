import Category from '../models/category.js';
import db from '../config/db.js';

export const createCategory = async (req, res) => {
    const { name } = req.body;
    const managerId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const [department] = await db.query('SELECT * FROM Departments WHERE manager_id = ?', [managerId]);
        if (!department.length) {
            return res.status(400).json({ message: 'Manager is not assigned to a department' });
        }
        const departmentId = department[0].id;

        const [existingCategory] = await db.query(
            'SELECT * FROM Categories WHERE name = ? AND department_id = ?',
            [name, departmentId]
        );
        if (existingCategory.length) {
            return res.status(400).json({ message: 'Category name already exists in your department' });
        }

        const category = await Category.create({ name, departmentId });
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};