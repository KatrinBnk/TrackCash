import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import db from '../../../config/db.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser, createDepartment } from '../testHelpers.js';

let managerDepartmentId;

before(async () => {
    await setupDatabase();
    const adminToken = await loginUser({ username: 'admin1', password: '123456' });
    const department = await createDepartment(adminToken, { name: 'IT Department', manager_id: 2 });
    managerDepartmentId = department.id;

    // Создаём тестовые категории для менеджера
    const managerToken = await loginUser({ username: 'manager1', password: '123456' });
    await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Travel Expenses' });
    await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Training Costs' });
    await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Office Supplies' });

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
        expect(res.body).to.have.lengthOf.at.least(3);
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
        expect(res.body).to.have.lengthOf.at.least(3);
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
    it('should return 400 if employee is not assigned to a department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'employee2', password: '123456', role: 'employee' });

        const employee2Token = await loginUser({ username: 'employee2', password: '123456' });

        const res = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${employee2Token}`)
            .expect(400);

        expect(res.body).to.have.property('message', 'Employee is not assigned to a department');
    });
    it('should return empty array if no categories exist in department', async () => {
        const adminToken = await loginUser({ username: 'admin1', password: '123456' });
        const newDepartment = await createDepartment(adminToken, { name: 'HR Department', manager_id: 3 });

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
    it('should allow manager to filter categories by name', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/categories?name=Travel')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('name', 'Travel Expenses');
        expect(res.body[0]).to.have.property('department_id', managerDepartmentId);
    });
    it('should allow employee to filter categories by name', async () => {
        const employeeToken = await loginUser({ username: 'employee1', password: '123456' });

        const res = await request(app)
            .get('/api/categories?name=Office')
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('name', 'Office Supplies');
        expect(res.body[0]).to.have.property('department_id', managerDepartmentId);
    });
    it('should filter categories case-insensitively', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/categories?name=TraVeL')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('name', 'Travel Expenses');
    });
    it('should return empty array if no matches for filter', async () => {
        const managerToken = await loginUser({ username: 'manager1', password: '123456' });

        const res = await request(app)
            .get('/api/categories?name=NonExistent')
            .set('Authorization', `Bearer ${managerToken}`)
            .expect(200);

        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(0);
    });
});