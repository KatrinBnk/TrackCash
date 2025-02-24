import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import { setupDatabase } from './testSetup.js';

let categoryId;

before(async () => {
    const setup = await setupDatabase();
    categoryId = setup.categoryId;
});

describe('Transactions API', () => {
    describe('POST /api/transactions', () => {
        it('should allow employee to add a transaction', (done) => {
            const employeeCredentials = { username: 'employee1', password: '123456' };
            const transaction = {
                category_id: categoryId,
                type: 'expense',
                amount: 50.00,
                date: '2025-02-23',
                comment: 'Lunch expense',
            };

            // Логиним сотрудника
            request(app)
                .post('/api/auth/login')
                .send(employeeCredentials)
                .end((err, employeeLoginRes) => {
                    if (err) return done(err);
                    const employeeToken = employeeLoginRes.body.token;

                    // Добавляем транзакцию
                    request(app)
                        .post('/api/transactions')
                        .set('Authorization', `Bearer ${employeeToken}`)
                        .send(transaction)
                        .expect(201)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Transaction added successfully');
                            expect(res.body.transaction).to.have.property('amount', 50);
                            expect(res.body.transaction).to.have.property('type', 'expense');
                            done();
                        });
                });
        });

        it('should return 403 if non-employee tries to add a transaction', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const transaction = {
                category_id: categoryId,
                type: 'expense',
                amount: 100.00,
                date: '2025-02-23',
                comment: 'Office supplies',
            };

            // Логиним администратора
            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    // Пытаемся добавить транзакцию
                    request(app)
                        .post('/api/transactions')
                        .set('Authorization', `Bearer ${token}`)
                        .send(transaction)
                        .expect(403)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Employee access required');
                            done();
                        });
                });
        });
    });
});