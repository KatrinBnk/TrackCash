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

    describe('PUT /api/departments/:id', () => {
        it('should allow admin to update a department', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const initialDepartment = { name: 'Sales Department' };
            const updatedDepartment = { name: 'Marketing Department', manager_id: 2 }; // manager1 из setupDatabase

            // Создаём отдел
            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .post('/api/departments')
                        .set('Authorization', `Bearer ${token}`)
                        .send(initialDepartment)
                        .end((err, createRes) => {
                            if (err) return done(err);
                            const departmentId = createRes.body.department.id;

                            // Обновляем отдел
                            request(app)
                                .put(`/api/departments/${departmentId}`)
                                .set('Authorization', `Bearer ${token}`)
                                .send(updatedDepartment)
                                .expect(200)
                                .end((err, res) => {
                                    if (err) return done(err);
                                    expect(res.body).to.have.property('message', 'Department updated successfully');
                                    expect(res.body.department).to.have.property('name', 'Marketing Department');
                                    expect(res.body.department).to.have.property('manager_id', 2);
                                    done();
                                });
                        });
                });
        });
        it('should return 403 if non-admin tries to update a department', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const employeeCredentials = { username: 'employee1', password: '123456' };
            const initialDepartment = { name: 'Finance Department' };
            const updatedDepartment = { name: 'Accounting Department' };

            // Создаём отдел как админ
            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, adminLoginRes) => {
                    if (err) return done(err);
                    const adminToken = adminLoginRes.body.token;

                    request(app)
                        .post('/api/departments')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send(initialDepartment)
                        .end((err, createRes) => {
                            if (err) return done(err);
                            const departmentId = createRes.body.department.id;

                            // Логиним сотрудника
                            request(app)
                                .post('/api/auth/login')
                                .send(employeeCredentials)
                                .end((err, employeeLoginRes) => {
                                    if (err) return done(err);
                                    const employeeToken = employeeLoginRes.body.token;

                                    // Пытаемся обновить отдел
                                    request(app)
                                        .put(`/api/departments/${departmentId}`)
                                        .set('Authorization', `Bearer ${employeeToken}`)
                                        .send(updatedDepartment)
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