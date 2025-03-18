import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment, getUserIdByUsername } from '../testHelpers.js';

describe('DELETE /api/transactions/:id', () => {
    let employeeDepartmentId;
    let categoryId;
    let transactionId;
    let employeeId;

    beforeEach(async () => {
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

    it('should allow employee to delete their transaction', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .delete(`/api/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        expect(res.body).to.have.property('message', 'Transaction deleted successfully');

        // Проверяем, что транзакция действительно удалена
        const check = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${employeeToken}`);
        expect(check.body.some(tx => tx.id === transactionId)).to.be.false;
    });

    it('should return 403 if non-employee tries to delete a transaction', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .delete(`/api/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'Employee access required');
    });

    it('should return 403 if employee tries to delete another employee’s transaction', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'employee2', password: '123456', role: 'employee' });
        await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [employeeDepartmentId, 'employee2']);

        const employee2Token = await loginUser({ username: 'employee2', password: '123456' });

        const res = await request(app)
            .delete(`/api/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${employee2Token}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'You can only delete your own transactions');
    });

    it('should return 404 if transaction not found', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .delete('/api/transactions/999')
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(404);

        expect(res.body).to.have.property('message', 'Transaction not found');
    });
});