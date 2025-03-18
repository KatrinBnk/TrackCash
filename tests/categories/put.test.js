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

describe('PUT /api/categories/:id', () => {
    it('should allow manager to update a category name', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const updatedCategory = { name: 'Updated Travel Expenses' };

        const res = await request(app)
            .put(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send(updatedCategory)
            .expect(200);

        expect(res.body).to.have.property('message', 'Category updated successfully');
        expect(res.body.category).to.have.property('name', 'Updated Travel Expenses');
        expect(res.body.category).to.have.property('id', categoryId);
        expect(res.body.category).to.have.property('department_id', managerDepartmentId);
    });
    it('should return 403 if non-manager tries to update a category', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const updatedCategory = { name: 'Employee Updated Category' };

        const res = await request(app)
            .put(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(updatedCategory)
            .expect(403);

        expect(res.body).to.have.property('message', 'Manager access required');
    });
    it('should return 400 if no name provided', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const updatedCategory = {};

        const res = await request(app)
            .put(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send(updatedCategory)
            .expect(400);

        expect(res.body).to.have.property('message', 'Category name is required');
    });
    it('should return 404 if category not found', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const updatedCategory = { name: 'Non-existent Category' };

        const res = await request(app)
            .put('/api/categories/999')
            .set('Authorization', `Bearer ${managerToken}`)
            .send(updatedCategory)
            .expect(404);

        expect(res.body).to.have.property('message', 'Category not found');
    });
    it('should return 403 if category belongs to another department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const newDepartment = await createDepartment(adminToken, { name: 'HR Department' });
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        // Создаём категорию в другом отделе
        await db.query('INSERT INTO Categories (name, department_id) VALUES (?, ?)', ['Other Category', newDepartment.id]);

        const [categories] = await db.query('SELECT * FROM Categories WHERE name = ? AND department_id = ?', ['Other Category', newDepartment.id]);
        const otherCategoryId = categories[0].id;

        const res = await request(app)
            .put(`/api/categories/${otherCategoryId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ name: 'Updated Other Category' })
            .expect(403);

        expect(res.body).to.have.property('message', 'Category does not belong to your department');
    });
});