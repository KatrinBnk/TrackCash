import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

let managerDepartmentId;
let categoryId;

before(async () => {
    await setupDatabase();
    const adminToken = await loginUser({ username: 'admin1', password: '123456' });
    const department = await createDepartment(adminToken, { name: 'IT Department', manager_id: 2 });
    managerDepartmentId = department.id;

    // Создаём тестовую категорию для менеджера
    const managerToken = await loginUser({ username: 'manager1', password: '123456' });
    const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Travel Expenses' });
    categoryId = res.body.category.id;

    // Привязываем сотрудника к отделу
    await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [managerDepartmentId, 'employee1']);
});

describe('DELETE /api/categories/:id', () => {
    it('should allow manager to delete a category', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .delete(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.have.property('message', 'Category deleted successfully');

        // Проверяем, что категория действительно удалена
        const check = await request(app)
            .get(`/api/categories`)
            .set('Authorization', `Bearer ${managerToken}`);
        expect(check.body.some(cat => cat.id === categoryId)).to.be.false;
    });
    it('should return 403 if non-manager tries to delete a category', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .delete(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'Manager access required');
    });
    it('should return 404 if category not found', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .delete('/api/categories/999')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(404);

        expect(res.body).to.have.property('message', 'Category not found');
    });
    it('should return 403 if category belongs to another department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const newDepartment = await createDepartment(adminToken, { name: 'HR Department' });

        // Создаём категорию в другом отделе
        await db.query('INSERT INTO Categories (name, department_id) VALUES (?, ?)', ['Other Category', newDepartment.id]);
        const [categories] = await db.query('SELECT * FROM Categories WHERE name = ? AND department_id = ?', ['Other Category', newDepartment.id]);
        const otherCategoryId = categories[0].id;

        const res = await request(app)
            .delete(`/api/categories/${otherCategoryId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'Category does not belong to your department');
    });
    it('should return 400 if category is in use by transactions', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        // Создаём новую категорию
        const newCategoryRes = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ name: 'Office Supplies' });
        const newCategoryId = newCategoryRes.body.category.id;

        // Добавляем транзакцию, связанную с категорией
        await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({
                category_id: newCategoryId,
                type: 'expense',
                amount: 50.00,
                date: '2025-02-23',
                comment: 'Office expense',
            });

        const res = await request(app)
            .delete(`/api/categories/${newCategoryId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(400);

        expect(res.body).to.have.property('message', 'Cannot delete category used in transactions');
    });
});