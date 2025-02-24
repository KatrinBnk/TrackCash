import db from '../config/db.js';

class Category {
    static async create({ name, departmentId }) {
        const [result] = await db.query(
            'INSERT INTO Categories (name, department_id) VALUES (?, ?)',
            [name, departmentId]
        );
        return { id: result.insertId, name, department_id: departmentId };
    }

    static async getByDepartmentId(departmentId, nameFilter = '') {
        let query = 'SELECT * FROM Categories WHERE department_id = ?';
        const params = [departmentId];

        if (nameFilter) {
            query += ' AND LOWER(name) LIKE LOWER(?)';
            params.push(`%${nameFilter}%`);
            params.push(`%${nameFilter}%`);
        }

        const [categories] = await db.query(query, params);
        return categories;
    }
}

export default Category;