import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

before(setupDatabase);

describe('PUT /api/departments/:id', () => {
    it('should allow admin to update a department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const initialDepartment = await createDepartment(adminToken, { name: 'Sales Department' });
        const updatedDepartment = { name: 'Marketing Department', manager_id: 2 };

        const res = await request(app)
            .put(`/api/departments/${initialDepartment.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updatedDepartment)
            .expect(200);

        expect(res.body).to.have.property('message', 'Department updated successfully');
        expect(res.body.department).to.have.property('name', 'Marketing Department');
        expect(res.body.department).to.have.property('manager_id', 2);
    });
    it('should return 403 if non-admin tries to update a department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const initialDepartment = await createDepartment(adminToken, { name: 'Finance Department' });
        const updatedDepartment = { name: 'Accounting Department' };

        const res = await request(app)
            .put(`/api/departments/${initialDepartment.id}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(updatedDepartment)
            .expect(403);

        expect(res.body).to.have.property('message', 'Admin access required');
    });
    it('should return 400 if no fields provided', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const initialDepartment = await createDepartment(adminToken, { name: 'Test Department' });

        const res = await request(app)
            .put(`/api/departments/${initialDepartment.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({})
            .expect(400);

        expect(res.body).to.have.property('message', 'At least one field (name or manager_id) must be provided');
    });
    it('should return 404 if department not found', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const updatedDepartment = { name: 'Non-existent Department' };

        const res = await request(app)
            .put('/api/departments/999')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updatedDepartment)
            .expect(404);

        expect(res.body).to.have.property('message', 'Department not found');
    });
    it('should return 400 if manager is already assigned to another department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        await createDepartment(adminToken, { name: 'Dept1', manager_id: 2 });
        const dept2 = await createDepartment(adminToken, { name: 'Dept2' });
        const updatedDept2 = { name: 'Dept2 Updated', manager_id: 2 };

        const res = await request(app)
            .put(`/api/departments/${dept2.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updatedDept2)
            .expect(400);

        expect(res.body).to.have.property('message', 'Manager is already assigned to another department');
    });
});