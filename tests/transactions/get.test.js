import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

let employeeDepartmentId;
let categoryId;

before(async () => {
    await setupDatabase();
    const adminToken = await loginUser({ username: 'admin1', password: '123456' });
    const department = await createDepartment(adminToken, { name: 'IT Department', manager_id: 2 });
    employeeDepartmentId = department.id;

    // Привязываем сотрудника к отделу
    await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [employeeDepartmentId, 'employee1']);

    // Создаём категорию для сотрудника
    const managerToken = await loginUser({ username: 'manager1', password: '123456' });
    const categoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Travel Expenses' });
    categoryId = categoryRes.body.category.id;

    // Создаём транзакцию для employee1
    const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
    await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
            category_id: categoryId,
            type: 'expense',
            amount: 50.00,
            date: '2025-02-23',
            comment: 'Lunch expense',
        });
});

describe('GET /api/transactions', () => {
    it('should allow employee to view their transactions', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf.at.least(1);
        expect(res.body[0]).to.have.property('category_id', categoryId);
        expect(res.body[0]).to.have.property('type', 'expense');
        expect(res.body[0]).to.have.property('amount', 50);
        expect(res.body[0]).to.have.property('comment', 'Lunch expense');
        expect(res.body[0]).to.have.property('user_id', req.user.id); // Проверяем, что это транзакция сотрудника
    });

    it('should return 403 if non-employee tries to view transactions', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'Employee access required');
    });

    it('should return 401 if no token provided', async () => {
        const res = await request(app)
            .get('/api/transactions')
            .expect(401);

        expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should return empty array if employee has no transactions', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'employee2', password: '123456', role: 'employee' });
        await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [employeeDepartmentId, 'employee2']);

        const employee2Token = await loginUser({ username: 'employee2', password: '123456' });

        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${employee2Token}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(0);
    });

    it('should filter transactions by category_id if provided', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .get(`/api/transactions?category_id=${categoryId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('category_id', categoryId);
    });
});