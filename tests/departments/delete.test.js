import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

before(setupDatabase);

describe('DELETE /api/departments/:id', () => {
    it('should allow admin to delete a department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const department = await createDepartment(adminToken, { name: 'Temp Department' });

        const res = await request(app)
            .delete(`/api/departments/${department.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(res.body).to.have.property('message', 'Department deleted successfully');
    });
    it('should return 400 if department is in use', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const department = await createDepartment(adminToken, { name: 'Used Department' });

        await db.query('INSERT INTO Categories (name, department_id) VALUES (?, ?)', ['Test Category', department.id]);

        const res = await request(app)
            .delete(`/api/departments/${department.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(400);

        expect(res.body).to.have.property('message', 'Cannot delete department with associated categories or users');
    });
    it('should return 403 if non-admin tries to delete a department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const department = await createDepartment(adminToken, { name: 'Temp Department' });

        const res = await request(app)
            .delete(`/api/departments/${department.id}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'Admin access required');
    });
    it('should return 404 if department not found', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });

        const res = await request(app)
            .delete('/api/departments/999')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(404);

        expect(res.body).to.have.property('message', 'Department not found');
    });
});