import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import { setupDatabase } from './testSetup.js';

before(setupDatabase);

describe('Departments API', () => {
    describe('POST /api/departments', () => {
        it('should allow admin to create a department', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const department = { name: 'IT Department' };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .post('/api/departments')
                        .set('Authorization', `Bearer ${token}`)
                        .send(department)
                        .expect(201)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Department created successfully');
                            expect(res.body.department).to.have.property('name', 'IT Department');
                            expect(res.body.department).to.have.property('id').that.is.a('number');
                            done();
                        });
                });
        });

        it('should return 403 if non-admin tries to create a department', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const employeeData = { username: 'employee1', password: '789101', role: 'employee' };
            const department = { name: 'HR Department' };

            // Регистрируем сотрудника
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

                                    // Пытаемся создать отдел
                                    request(app)
                                        .post('/api/departments')
                                        .set('Authorization', `Bearer ${employeeToken}`)
                                        .send(department)
                                        .expect(403)
                                        .end((err, res) => {
                                            if (err) return done(err);
                                            expect(res.body).to.have.property('message', 'Admin access required');
                                            done();
                                        });
                                });
                        });
                });
        });
    });
});