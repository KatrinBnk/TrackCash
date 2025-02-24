import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

let managerDepartmentId;

before(async () => {
    await setupDatabase();
    const adminToken = await loginUser({ username: 'admin1', password: '123456' });
    const department = await createDepartment(adminToken, { name: 'IT Department', manager_id: 2 });
    managerDepartmentId = department.id;
});

describe('POST /api/categories', () => {
    it('should allow manager to create a category in their department', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const category = { name: 'Travel Expenses' };

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${managerToken}`)
            .send(category)
            .expect(201);

        expect(res.body).to.have.property('message', 'Category created successfully');
        expect(res.body.category).to.have.property('name', 'Travel Expenses');
        expect(res.body.category).to.have.property('id').that.is.a('number');
        expect(res.body.category).to.have.property('department_id', managerDepartmentId);
    });

    it('should return 403 if non-manager tries to create a category', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
        const category = { name: 'Office Supplies' };

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(category)
            .expect(403);

        expect(res.body).to.have.property('message', 'Manager access required');
    });

    it('should return 400 if category name is missing', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });
        const category = {};

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${managerToken}`)
            .send(category)
            .expect(400);

        expect(res.body).to.have.property('message', 'Category name is required');
    });

    it('should return 400 if manager is not assigned to a department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        // Создаём второго менеджера без отдела
        await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'manager2', password: '123456', role: 'manager' });

        const manager2Token = await loginUser({ username: 'manager2', password: '123456' });
        const category = { name: 'Software Licenses' };

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${manager2Token}`)
            .send(category)
            .expect(400);

        expect(res.body).to.have.property('message', 'Manager is not assigned to a department');
    });
});