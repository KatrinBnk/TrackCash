import Department from '../models/department.js';

export const createDepartment = async (req, res) => {
    const { name, manager_id } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Наименование отдела ОБЯЗАТЕЛЬНОЕ поле. ' });
    }

    try {
        const department = await Department.create({ name, manager_id });
        res.status(201).json({ message: 'Отдел успешно создан', department });
    } catch (err) {
        console.error('Ошибка создания отдела:', err);
        res.status(500).json({ message:  err.message });
    }
};

export const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, manager_id } = req.body;

    if (!name && !manager_id) {
        return res.status(400).json({ message: 'Наименование отдела и идентификатор менеджера обязательны' });
    }

    try {
        const department = await Department.update(id, { name, manager_id });
        res.status(200).json({ message: 'Отдел успешно обновлен', department });
    } catch (err) {
        console.error('Ошибка обновления отдела:', err);
        res.status(err.status).json({ message: err.message });
    }
};

export const getDepartments = async (req, res) => {
    try {
        const departments = await Department.getAll();
        res.status(200).json(departments);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(err.status).json({ message: err.message });
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
        res.status(err.status).json({ message: err.message });
    }
};

export const deleteDepartment = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Department.delete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json({ message: 'Department deleted successfully' });
    } catch (err) {
        console.error('Error deleting department:', err);
        res.status(500).json({ message: err.message });
    }
};