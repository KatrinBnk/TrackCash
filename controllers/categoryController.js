import Category from '../models/category.js';
import db from '../config/db.js';

const getManagerDepartmentId = async (managerId) => {
    const [department] = await db.query('SELECT * FROM Departments WHERE manager_id = ?', [managerId]);
    if (!department.length) {
        throw { status: 400, message: 'Manager is not assigned to a department' };
    }
    return department[0].id;
};

const checkCategoryOwnership = async (id, departmentId) => {
    const [category] = await db.query('SELECT * FROM Categories WHERE id = ?', [id]);
    if (!category.length) {
        throw { status: 404, message: 'Category not found' };
    }
    if (category[0].department_id !== departmentId) {
        throw { status: 403, message: 'Category does not belong to your department' };
    }
    return category[0];
};

const handleError = (res, err, action) => {
    if (err.status) {
        return res.status(err.status).json({ message: err.message });
    }
    console.error(`Error ${action} category:`, err);
    return res.status(500).json({ message: 'Server error', error: err.message });
};

export const createCategory = async (req, res) => {
    const { name } = req.body;
    const managerId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const departmentId = await getManagerDepartmentId(managerId);

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
        handleError(res, err, 'creating');
    }
};

export const getCategories = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const nameFilter = req.query.name;

    try {
        if (userRole !== 'manager' && userRole !== 'employee') {
            return res.status(403).json({ message: 'Access restricted to managers and employees' });
        }

        let departmentId;
        if (userRole === 'manager') {
            departmentId = await getManagerDepartmentId(userId);
        } else if (userRole === 'employee') {
            const [user] = await db.query('SELECT department_id FROM Users WHERE id = ?', [userId]);
            if (!user.length || !user[0].department_id) {
                return res.status(400).json({ message: 'Employee is not assigned to a department' });
            }
            departmentId = user[0].department_id;
        }

        const categories = await Category.getByDepartmentId(departmentId, nameFilter);
        res.status(200).json(categories);
    } catch (err) {
        handleError(res, err, 'fetching');
    }
};

export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const managerId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const departmentId = await getManagerDepartmentId(managerId);
        await checkCategoryOwnership(id, departmentId);

        const [existingCategory] = await db.query(
            'SELECT * FROM Categories WHERE name = ? AND department_id = ? AND id != ?',
            [name, departmentId, id]
        );
        if (existingCategory.length) {
            return res.status(400).json({ message: 'Category name already exists in your department' });
        }

        const updatedCategory = await Category.update(id, { name });
        res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (err) {
        handleError(res, err, 'updating');
    }
};

export const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const managerId = req.user.id;

    try {
        const departmentId = await getManagerDepartmentId(managerId);
        await checkCategoryOwnership(id, departmentId);

        const [transactions] = await db.query('SELECT * FROM Transactions WHERE category_id = ?', [id]);
        if (transactions.length > 0) {
            return res.status(400).json({ message: 'Cannot delete category used in transactions' });
        }

        await Category.delete(id);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        handleError(res, err, 'deleting');
    }
};