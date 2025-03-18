import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';
import { setupDatabase } from '../testSetup.js';
import { loginUser } from '../testHelpers.js';

before(setupDatabase);

describe('POST /api/auth', () => {
    describe('POST /api/auth/register', () => {
        it('should allow admin to register a new user with full name', async () => {
            const adminToken = await loginUser({ username: 'admin1', password: '123456' });
            const newUser = {
                username: 'newuser1',
                password: 'password123',
                role: 'employee',
                surname: 'Doe',
                name: 'John',
                patronymic: 'Smith'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newUser)
                .expect(201);

            expect(res.body).to.have.property('message', 'User registered successfully');
            expect(res.body.user).to.have.property('username', 'newuser1');
            expect(res.body.user).to.have.property('role', 'employee');
            expect(res.body.user).to.have.property('name', 'John');
            expect(res.body.user).to.have.property('surname', 'Doe');
            expect(res.body.user).to.have.property('patronymic', 'Smith');
        });

        it('should return 403 if non-admin tries to register a user', async () => {
            const employeeToken = await loginUser({ username: 'employee1', password: '123456' });
            const newUser = {
                username: 'newuser2',
                password: 'password123',
                role: 'employee',
                name: 'Jane',
                surname: 'Doe',
                patronymic: 'Smith'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send(newUser)
                .expect(403);

            expect(res.body).to.have.property('message', 'Admin access required');
        });

        it('should return 400 if username already exists', async () => {
            const adminToken = await loginUser({ username: 'admin1', password: '123456' });
            const duplicateUser = {
                username: 'employee1',
                password: 'newpassword',
                role: 'employee',
                name: 'Existing',
                surname: 'User',
                patronymic: 'Test'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(duplicateUser)
                .expect(400);

            expect(res.body).to.have.property('message', 'Username already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login a user and return a token', async () => {
            const credentials = { username: 'admin1', password: '123456' };

            const res = await request(app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(200);

            expect(res.body).to.have.property('message', 'Login successful');
            expect(res.body).to.have.property('token').that.is.a('string');
            expect(res.body.user).to.have.property('username', 'admin1');
            expect(res.body.user).to.have.property('role', 'admin');
            // Примечание: ФИО не возвращаются в ответе login по текущему коду контроллера
        });

        it('should return 401 if credentials are incorrect', async () => {
            const credentials = { username: 'admin1', password: 'wrongpassword' };

            const res = await request(app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(401);

            expect(res.body).to.have.property('message', 'Invalid username or password');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should allow a user to logout successfully', async () => {
            const userToken = await loginUser({ username: 'admin1', password: '123456' });

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body).to.have.property('message', 'Logged out successfully');
        });

        it('should return 401 if no token is provided for logout', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(res.body).to.have.property('message', 'Access token required');
        });
    });
});