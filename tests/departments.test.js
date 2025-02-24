import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import { setupDatabase } from './testSetup.js';

before(setupDatabase);

describe('Departments API', () => {
    describe('POST /api/departments', () => {

        it('should return 403 if non-admin tries to create a department', (done) => {
            const employeeCredentials = { username: 'employee1', password: '123456' }; // Пароль из setupDatabase
            const department = { name: 'HR Department' };

            // Логиним сотрудника
            request(app)
                .post('/api/auth/login')
                .send(employeeCredentials)
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

        it('should return 400 if department name is missing', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const department = {};

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
                        .expect(400)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Department name is required');
                            done();
                        });
                });
        });

        it('should allow admin to create a department without manager', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const department = { name: 'IT Department 1' };

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
                            expect(res.body.department).to.have.property('name', 'IT Department 1');
                            expect(res.body.department).to.have.property('id').that.is.a('number');
                            done();
                        });
                });
        });

        it('should allow admin to create a department with manager', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const department = { name: 'IT Department', manager_id: 2 };

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
    });
});