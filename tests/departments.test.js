import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import { setupDatabase } from './testSetup.js';

before(setupDatabase);

//TODO: Добавить проверку и других исключительных ситуаций

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
        it('should return 400 if no fields provided', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const initialDepartment = { name: 'Test Department' };

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

                            request(app)
                                .put(`/api/departments/${departmentId}`)
                                .set('Authorization', `Bearer ${token}`)
                                .send({})
                                .expect(400)
                                .end((err, res) => {
                                    if (err) return done(err);
                                    expect(res.body).to.have.property('message', 'At least one field (name or manager_id) must be provided');
                                    done();
                                });
                        });
                });
        });
        it('should return 404 if department not found', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const updatedDepartment = { name: 'Non-existent Department' };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .put('/api/departments/999')
                        .set('Authorization', `Bearer ${token}`)
                        .send(updatedDepartment)
                        .expect(404)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Department not found');
                            done();
                        });
                });
        });
        it('should return 400 if manager is already assigned to another department', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const dept1 = { name: 'Dept1', manager_id: 2 }; // manager1 из setupDatabase
            const dept2 = { name: 'Dept2' };
            const updatedDept2 = { name: 'Dept2 Updated', manager_id: 2 };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    // Создаём первый отдел с менеджером
                    request(app)
                        .post('/api/departments')
                        .set('Authorization', `Bearer ${token}`)
                        .send(dept1)
                        .end((err) => {
                            if (err) return done(err);

                            // Создаём второй отдел
                            request(app)
                                .post('/api/departments')
                                .set('Authorization', `Bearer ${token}`)
                                .send(dept2)
                                .end((err, createRes) => {
                                    if (err) return done(err);
                                    const dept2Id = createRes.body.department.id;

                                    // Пытаемся назначить занятого менеджера
                                    request(app)
                                        .put(`/api/departments/${dept2Id}`)
                                        .set('Authorization', `Bearer ${token}`)
                                        .send(updatedDept2)
                                        .expect(400)
                                        .end((err, res) => {
                                            if (err) return done(err);
                                            expect(res.body).to.have.property('message', 'Manager is already assigned to another department');
                                            done();
                                        });
                                });
                        });
                });
        });
    });

    describe('GET /api/departments', () => {
        it('should allow admin to view departments', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const department = { name: 'Test Department' };

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
                        .end((err) => {
                            if (err) return done(err);

                            request(app)
                                .get('/api/departments')
                                .set('Authorization', `Bearer ${token}`)
                                .expect(200)
                                .end((err, res) => {
                                    if (err) return done(err);
                                    expect(res.body).to.be.an('array');
                                    expect(res.body).to.have.lengthOf.at.least(1);
                                    expect(res.body[0]).to.have.property('name', 'Test Department');
                                    done();
                                });
                        });
                });
        });
        it('should allow manager to view departments', (done) => {
            const managerCredentials = { username: 'manager1', password: '123456' };

            request(app)
                .post('/api/auth/login')
                .send(managerCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .get('/api/departments')
                        .set('Authorization', `Bearer ${token}`)
                        .expect(200)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.be.an('array');
                            done();
                        });
                });
        });
        it('should allow employee to view departments', (done) => {
            const employeeCredentials = { username: 'employee1', password: '123456' };

            request(app)
                .post('/api/auth/login')
                .send(employeeCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .get('/api/departments')
                        .set('Authorization', `Bearer ${token}`)
                        .expect(200)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.be.an('array');
                            done();
                        });
                });
        });
        it('should return 401 if no token provided', (done) => {
            request(app)
                .get('/api/departments')
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('message', 'Access token required');
                    done();
                });
        });
    });

    describe('GET /api/departments/:id', () => {
        it('should allow admin to view a department by id', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const department = { name: 'HR Department' };

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
                        .end((err, createRes) => {
                            if (err) return done(err);
                            const departmentId = createRes.body.department.id;

                            request(app)
                                .get(`/api/departments/${departmentId}`)
                                .set('Authorization', `Bearer ${token}`)
                                .expect(200)
                                .end((err, res) => {
                                    if (err) return done(err);
                                    expect(res.body).to.be.an('object');
                                    expect(res.body).to.have.property('name', 'HR Department');
                                    expect(res.body).to.have.property('id', departmentId);
                                    done();
                                });
                        });
                });
        });
        it('should allow manager to view a department by id', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const managerCredentials = { username: 'manager1', password: '123456' };
            const department = { name: 'Finance Department' };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, adminLoginRes) => {
                    if (err) return done(err);
                    const adminToken = adminLoginRes.body.token;

                    request(app)
                        .post('/api/departments')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send(department)
                        .end((err, createRes) => {
                            if (err) return done(err);
                            const departmentId = createRes.body.department.id;

                            request(app)
                                .post('/api/auth/login')
                                .send(managerCredentials)
                                .end((err, managerLoginRes) => {
                                    if (err) return done(err);
                                    const managerToken = managerLoginRes.body.token;

                                    request(app)
                                        .get(`/api/departments/${departmentId}`)
                                        .set('Authorization', `Bearer ${managerToken}`)
                                        .expect(200)
                                        .end((err, res) => {
                                            if (err) return done(err);
                                            expect(res.body).to.be.an('object');
                                            expect(res.body).to.have.property('name', 'Finance Department');
                                            done();
                                        });
                                });
                        });
                });
        });
        it('should allow employee to view a department by id', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const employeeCredentials = { username: 'employee1', password: '123456' };
            const department = { name: 'Support Department' };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, adminLoginRes) => {
                    if (err) return done(err);
                    const adminToken = adminLoginRes.body.token;

                    request(app)
                        .post('/api/departments')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send(department)
                        .end((err, createRes) => {
                            if (err) return done(err);
                            const departmentId = createRes.body.department.id;

                            request(app)
                                .post('/api/auth/login')
                                .send(employeeCredentials)
                                .end((err, employeeLoginRes) => {
                                    if (err) return done(err);
                                    const employeeToken = employeeLoginRes.body.token;

                                    request(app)
                                        .get(`/api/departments/${departmentId}`)
                                        .set('Authorization', `Bearer ${employeeToken}`)
                                        .expect(200)
                                        .end((err, res) => {
                                            if (err) return done(err);
                                            expect(res.body).to.be.an('object');
                                            expect(res.body).to.have.property('name', 'Support Department');
                                            done();
                                        });
                                });
                        });
                });
        });
        it('should return 404 if department not found', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .get('/api/departments/999') // Несуществующий ID
                        .set('Authorization', `Bearer ${token}`)
                        .expect(404)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Department not found');
                            done();
                        });
                });
        });
        it('should return 401 if no token provided', (done) => {
            request(app)
                .get('/api/departments/1')
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('message', 'Access token required');
                    done();
                });
        });
    });
});