import request from 'supertest';
import app from '../server.js';
import db from "../config/db.js";

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

export const getUserIdByUsername = async (username) => {
    const [user] = await db.query('SELECT id FROM Users WHERE username = ?', [username]);
    return user[0]?.id;
};