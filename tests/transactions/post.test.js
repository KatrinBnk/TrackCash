import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment, getUserIdByUsername } from '../testHelpers.js';

let employeeDepartmentId;
let expenseCategoryId;
let employeeId;

before(async () => {
    await setupDatabase();
    const adminToken = await loginUser({ username: 'admin1', password: '123456' });
    const department = await createDepartment(adminToken, { name: 'IT Department', manager_id: 2 });
    employeeDepartmentId = department.id;

    // Привязываем сотрудника к отделу
    await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [employeeDepartmentId, 'employee1']);
    employeeId = await getUserIdByUsername('employee1');

    const managerToken = await loginUser({ username: 'manager1', password: '123456' });
    // Создаём категорию для расходов
    const expenseCategoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Travel Expenses' });
    expenseCategoryId = expenseCategoryRes.body.category.id;
});

describe('POST /api/transactions', () => {
    it('should allow employee to add an expense transaction', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const transaction = {
            user_id: employeeId,
            category_id: expenseCategoryId,
            type: 'expense',
            amount: 50.00,
            date: '2025-02-23',
            comment: 'Lunch expense',
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(transaction)
            .expect(201);

        expect(res.body).to.have.property('message', 'Transaction added successfully');
        expect(res.body.transaction).to.have.property('type', 'expense');
        expect(res.body.transaction).to.have.property('amount', 50);
        expect(res.body.transaction).to.have.property('date', '2025-02-23');
        expect(res.body.transaction).to.have.property('comment', 'Lunch expense');
        expect(res.body.transaction).to.have.property('user_id', employeeId);
    });

    it('should return 403 if non-employee tries to add an expense transaction', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const transaction = {
            user_id: employeeId,
            category_id: expenseCategoryId,
            type: 'expense',
            amount: 100.00,
            date: '2025-02-23 00:00:00',
            comment: 'Office supplies',
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${managerToken}`)
            .send(transaction)
            .expect(403);

        expect(res.body).to.have.property('message', 'Employee access required');
    });

    it('should allow manager to add an income transaction for an employee in their department', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const income = {
            user_id: employeeId,
            type: 'income',
            amount: 1000.00,
            date: '2025-02-25',
            comment: 'Bonus for Q1',
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${managerToken}`)
            .send(income)
            .expect(201);

        expect(res.body).to.have.property('message', 'Transaction added successfully');
        expect(res.body.transaction).to.have.property('type', 'income');
        expect(res.body.transaction).to.have.property('amount', 1000);
        expect(res.body.transaction).to.have.property('date', '2025-02-25');
        expect(res.body.transaction).to.have.property('comment', 'Bonus for Q1');
        expect(res.body.transaction).to.have.property('user_id', employeeId);
    });

    it('should return 403 if non-manager tries to add an income transaction', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const income = {
            user_id: employeeId,
            type: 'income',
            amount: 500.00,
            date: '2025-02-25',
            comment: 'Salary',
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(income)
            .expect(403);

        expect(res.body).to.have.property('message', 'Manager access required');
    });

    it('should return 400 if user_id is invalid or not in manager’s department', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const income = {
            user_id: 999,
            type: 'income',
            amount: 1000.00,
            date: '2025-02-25',
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${managerToken}`)
            .send(income)
            .expect(400);

        expect(res.body).to.have.property('message', 'Invalid user_id or user not in your department');
    });
});