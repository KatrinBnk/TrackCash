import request from 'supertest';
import app from '../server.js';

export const loginUser = async (credentials) => {
    const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);
    return res.body.token;
};

export const createDepartment = async (token, department) => {
    const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${token}`)
        .send(department);
    return res.body.department;
};