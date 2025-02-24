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

export const getCategories = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Только менеджеры и сотрудники могут видеть категории
        if (userRole !== 'manager' && userRole !== 'employee') {
            return res.status(403).json({ message: 'Access restricted to managers and employees' });
        }

        let departmentId;
        if (userRole === 'manager') {
            const [department] = await db.query('SELECT * FROM Departments WHERE manager_id = ?', [userId]);
            if (!department.length) {
                return res.status(400).json({ message: 'Manager is not assigned to a department' });
            }
            departmentId = department[0].id;
        } else if (userRole === 'employee') {
            const [user] = await db.query('SELECT department_id FROM Users WHERE id = ?', [userId]);
            if (!user.length || !user[0].department_id) {
                return res.status(400).json({ message: 'Employee is not assigned to a department' });
            }
            departmentId = user[0].department_id;
        }

        const categories = await Category.getByDepartmentId(departmentId);
        res.status(200).json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};