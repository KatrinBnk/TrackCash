import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser } from '../testHelpers.js';

let categoryId;

before(async () => {
    const setup = await setupDatabase();
    categoryId = setup.categoryId;
});

describe('POST /api/transactions', () => {
    it('should allow employee to add a transaction', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const transaction = {
            category_id: categoryId,
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
        expect(res.body.transaction).to.have.property('amount', 50);
        expect(res.body.transaction).to.have.property('type', 'expense');
    });
    it('should return 403 if non-employee tries to add a transaction', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const transaction = {
            category_id: categoryId,
            type: 'expense',
            amount: 100.00,
            date: '2025-02-23',
            comment: 'Office supplies',
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(transaction)
            .expect(403);

        expect(res.body).to.have.property('message', 'Employee access required');
    });
});