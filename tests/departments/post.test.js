import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser } from '../testHelpers.js';

before(setupDatabase);

describe('POST /api/departments', () => {
    it('should return 403 if non-admin tries to create a department', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const department = { name: 'HR Department' };

        const res = await request(app)
            .post('/api/departments')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(department)
            .expect(403);

        expect(res.body).to.have.property('message', 'Admin access required');
    });
    it('should return 400 if department name is missing', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const department = {};

        const res = await request(app)
            .post('/api/departments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(department)
            .expect(400);

        expect(res.body).to.have.property('message', 'Department name is required');
    });
    it('should allow admin to create a department without manager', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const department = { name: 'IT Department 1' };

        const res = await request(app)
            .post('/api/departments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(department)
            .expect(201);

        expect(res.body).to.have.property('message', 'Department created successfully');
        expect(res.body.department).to.have.property('name', 'IT Department 1');
        expect(res.body.department).to.have.property('id').that.is.a('number');
    });
    it('should allow admin to create a department with manager', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const department = { name: 'IT Department', manager_id: 2 };

        const res = await request(app)
            .post('/api/departments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(department)
            .expect(201);

        expect(res.body).to.have.property('message', 'Department created successfully');
        expect(res.body.department).to.have.property('name', 'IT Department');
        expect(res.body.department).to.have.property('id').that.is.a('number');
    });
});