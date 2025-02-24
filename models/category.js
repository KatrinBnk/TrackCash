import db from '../config/db.js';

class Category {
    static async create({ name, departmentId }) {
        const [result] = await db.query(
            'INSERT INTO Categories (name, department_id) VALUES (?, ?)',
            [name, departmentId]
        );
        return { id: result.insertId, name, department_id: departmentId };
    }

    static async getByDepartmentId(departmentId) {
        const [categories] = await db.query(
            'SELECT * FROM Categories WHERE department_id = ?',
            [departmentId]
        );
        return categories;
    }
}

export default Category;