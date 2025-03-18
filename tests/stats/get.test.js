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

    const managerToken = await loginUser({ username: 'manager1', password: '123456' });
    const categoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Travel Expenses' });
    categoryId = categoryRes.body.category.id;

    const employee1Token = await loginUser({ username: 'employee1', password: '123456' });
    await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [managerDepartmentId, 'employee1']);
    await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${employee1Token}`)
        .send({
            category_id: categoryId,
            type: 'expense',
            amount: 50.00,
            date: '2025-02-23 00:00:00',
            comment: 'Employee1 lunch expense',
        });

    await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'employee2', password: '123456', role: 'employee' });
    await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [managerDepartmentId, 'employee2']);
    const employee2Token = await loginUser({ username: 'employee2', password: '123456' });
    await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${employee2Token}`)
        .send({
            category_id: categoryId,
            type: 'expense',
            amount: 75.00,
            date: '2025-02-24 00:00:00',
            comment: 'Employee2 travel expense',
        });

    const [transactions] = await db.query('SELECT * FROM Transactions WHERE category_id = ? AND date BETWEEN ? AND ?', [categoryId, '2025-02-23', '2025-02-24']);
    if (transactions.length !== 2) {
        throw new Error(`Expected 2 transactions, but found ${transactions.length}: ${JSON.stringify(transactions)}`);
    }
});

describe('GET /api/stats/department', () => {
    it('should allow manager to view department transactions in a date range', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/stats/department?dateFrom=2025-02-23&dateTo=2025-02-23')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('amount', 50);
        expect(res.body[0]).to.have.property('date', '2025-02-23');
        expect(res.body[0]).to.have.property('comment', 'Employee1 lunch expense');
    });

    it('should return 403 if non-manager tries to view department stats', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .get('/api/stats/department')
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'Manager access required');
    });

    it('should return 401 if no token provided', async () => {
        const res = await request(app)
            .get('/api/stats/department')
            .expect(401);

        expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should return empty array if no transactions in date range', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/stats/department?dateFrom=2025-01-01&dateTo=2025-01-31')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(0);
    });

    it('should filter transactions by category_id if provided', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get(`/api/stats/department?category_id=${categoryId}&dateFrom=2025-02-23&dateTo=2025-02-24`)
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(2); // Ожидаем обе транзакции
        expect(res.body.every(tx => tx.category_id === categoryId)).to.be.true;
        expect(res.body.some(tx => tx.date === '2025-02-23' && tx.amount === 50)).to.be.true;
        expect(res.body.some(tx => tx.date === '2025-02-24' && tx.amount === 75)).to.be.true;
    });
});