import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

before(setupDatabase);

describe('GET /api/departments', () => {
    it('should allow admin to view departments', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        await createDepartment(adminToken, { name: 'Test Department' });

        const res = await request(app)
            .get('/api/departments')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf.at.least(1);
        expect(res.body.some(dept => dept.name === 'Test Department')).to.be.true;
    });
    it('should allow manager to view departments', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/departments')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
    });
    it('should allow employee to view departments', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .get('/api/departments')
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
    });
    it('should return 401 if no token provided', async () => {
        const res = await request(app)
            .get('/api/departments')
            .expect(401);

        expect(res.body).to.have.property('message', 'Access token required');
    });
});

describe('GET /api/departments/:id', () => {
    it('should allow admin to view a department by id', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const department = await createDepartment(adminToken, { name: 'HR Department' });

        const res = await request(app)
            .get(`/api/departments/${department.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('name', 'HR Department');
        expect(res.body).to.have.property('id', department.id);
    });
    it('should allow manager to view a department by id', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const department = await createDepartment(adminToken, { name: 'Finance Department' });

        const res = await request(app)
            .get(`/api/departments/${department.id}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('name', 'Finance Department');
    });
    it('should allow employee to view a department by id', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const department = await createDepartment(adminToken, { name: 'Support Department' });

        const res = await request(app)
            .get(`/api/departments/${department.id}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('name', 'Support Department');
    });
    it('should return 404 if department not found', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });

        const res = await request(app)
            .get('/api/departments/999')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(404);

        expect(res.body).to.have.property('message', 'Department not found');
    });
    it('should return 401 if no token provided', async () => {
        const res = await request(app)
            .get('/api/departments/1')
            .expect(401);

        expect(res.body).to.have.property('message', 'Access token required');
    });
});