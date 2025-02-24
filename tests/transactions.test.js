import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import { setupDatabase } from "./testSetup.js";

before(setupDatabase);

describe('Transactions API', () => {
    describe('POST /api/transactions', () => {
        it('should allow employee to add a transaction', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const employeeData = { username: 'employee1', password: '789101', role: 'employee' };
            const transaction = {
                category_id: 1,
                type: 'expense',
                amount: 50.00,
                date: '2025-02-23',
                comment: 'Lunch expense',
            };

            // Сначала регистрируем сотрудника
            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, adminLoginRes) => {
                    if (err) return done(err);
                    const adminToken = adminLoginRes.body.token;

                    request(app)
                        .post('/api/auth/register')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send(employeeData)
                        .end((err) => {
                            if (err) return done(err);

                            // Логиним сотрудника
                            request(app)
                                .post('/api/auth/login')
                                .send(employeeData)
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
                });
        });

        it('should return 403 if non-employee tries to add a transaction', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const transaction = {
                category_id: 1,
                type: 'expense',
                amount: 100.00,
                date: '2025-02-23',
                comment: 'Office supplies',
            };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

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