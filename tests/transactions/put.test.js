import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment, getUserIdByUsername } from '../testHelpers.js';

let employeeDepartmentId;
let categoryId;
let transactionId;
let employeeId;

before(async () => {
    await setupDatabase();
    const adminToken = await loginUser({ username: 'admin1', password: '123456' });
    const department = await createDepartment(adminToken, { name: 'IT Department', manager_id: 2 });
    employeeDepartmentId = department.id;

    await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [employeeDepartmentId, 'employee1']);

    const managerToken = await loginUser({ username: 'manager1', password: '123456' });
    const categoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Travel Expenses' });
    categoryId = categoryRes.body.category.id;

    const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
    const transactionRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
            category_id: categoryId,
            type: 'expense',
            amount: 50.00,
            date: '2025-02-23',
            comment: 'Lunch expense',
        });
    transactionId = transactionRes.body.transaction.id;

    employeeId = await getUserIdByUsername('employee1');
});

describe('PUT /api/transactions/:id', () => {
    it('should allow employee to update their transaction', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const updatedTransaction = {
            category_id: categoryId,
            type: 'expense',
            amount: 75.00,
            date: '2025-02-24',
            comment: 'Updated lunch expense',
        };

        const res = await request(app)
            .put(`/api/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(updatedTransaction)
            .expect(200);

        expect(res.body).to.have.property('message', 'Transaction updated successfully');
        expect(res.body.transaction).to.have.property('category_id', categoryId);
        expect(res.body.transaction).to.have.property('type', 'expense');
        expect(res.body.transaction).to.have.property('amount', 75);
        expect(res.body.transaction).to.have.property('date', '2025-02-24');
        expect(res.body.transaction).to.have.property('comment', 'Updated lunch expense');
        expect(res.body.transaction).to.have.property('user_id', employeeId);
    });

    it('should return 403 if non-employee tries to update a transaction', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const updatedTransaction = {
            amount: 100.00,
        };

        const res = await request(app)
            .put(`/api/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send(updatedTransaction)
            .expect(403);

        expect(res.body).to.have.property('message', 'Employee access required');
    });

    it('should return 403 if employee tries to update another employee’s transaction', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'employee2', password: '123456', role: 'employee' });
        await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [employeeDepartmentId, 'employee2']);

        const employee2Token = await loginUser({ username: 'employee2', password: '123456' });
        const updatedTransaction = {
            amount: 60.00,
        };

        const res = await request(app)
            .put(`/api/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${employee2Token}`)
            .send(updatedTransaction)
            .expect(403);

        expect(res.body).to.have.property('message', 'You can only update your own transactions');
    });

    it('should return 404 if transaction not found', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const updatedTransaction = {
            amount: 80.00,
        };

        const res = await request(app)
            .put('/api/transactions/999')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(updatedTransaction)
            .expect(404);

        expect(res.body).to.have.property('message', 'Transaction not found');
    });

    it('should return 400 if required fields are missing', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const updatedTransaction = {
            comment: 'Updated comment',
        };

        const res = await request(app)
            .put(`/api/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(updatedTransaction)
            .expect(400);

        expect(res.body).to.have.property('message', 'All required fields must be provided');
    });
});