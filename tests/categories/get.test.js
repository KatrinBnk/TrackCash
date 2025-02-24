import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

let managerDepartmentId;

before(async () => {
    await setupDatabase();
    const adminToken = await loginUser({ username: 'admin1', password: '123456' });
    const department = await createDepartment(adminToken, { name: 'IT Department', manager_id: 2 });
    managerDepartmentId = department.id;

    // Создаём тестовую категорию для менеджера
    const managerToken = await loginUser({ username: 'manager1', password: '123456' });
    await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Travel Expenses' });

    // Привязываем сотрудника к отделу
    await db.query('UPDATE Users SET department_id = ? WHERE username = ?', [managerDepartmentId, 'employee1']);
});

describe('GET /api/categories', () => {
    it('should allow manager to view categories in their department', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf.at.least(1);
        expect(res.body.some(cat => cat.name === 'Travel Expenses')).to.be.true;
        expect(res.body.every(cat => cat.department_id === managerDepartmentId)).to.be.true;
    });

    it('should allow employee to view categories in their department', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf.at.least(1);
        expect(res.body.some(cat => cat.name === 'Travel Expenses')).to.be.true;
        expect(res.body.every(cat => cat.department_id === managerDepartmentId)).to.be.true;
    });

    it('should return 403 if admin tries to view categories', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });

        const res = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(403);

        expect(res.body).to.have.property('message', 'Access restricted to managers and employees');
    });

    it('should return 401 if no token provided', async () => {
        const res = await request(app)
            .get('/api/categories')
            .expect(401);

        expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should return empty array if no categories exist in department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const newDepartment = await createDepartment(adminToken, { name: 'HR Department', manager_id: 3 });

        // Создаём второго менеджера и привязываем его к новому отделу
        await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'manager2', password: '123456', role: 'manager' });
        await db.query('UPDATE Departments SET manager_id = (SELECT id FROM Users WHERE username = "manager2") WHERE id = ?', [newDepartment.id]);

        const manager2Token = await loginUser({ username: 'manager2', password: '123456' });

        const res = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${manager2Token}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(0);
    });
});