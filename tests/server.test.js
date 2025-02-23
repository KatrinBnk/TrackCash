import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';

describe('Auth API', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', (done) => {
            const user = {
                username: 'admin1',
                password: '123456',
                role: 'admin',
            };

            request(app)
                .post('/api/auth/register')
                .send(user)
                .expect(201)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('message', 'User registered successfully');
                    expect(res.body.user).to.have.property('username', 'admin1');
                    expect(res.body.user).to.have.property('role', 'admin');
                    done();
                });
        });

        it('should return 400 if username already exists', (done) => {
            const user = {
                username: 'admin1',
                password: '654321',
                role: 'manager',
            };

            request(app)
                .post('/api/auth/register')
                .send(user)
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('message', 'Username already exists');
                    done();
                });
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login a user with correct credentials', (done) => {
            const credentials = {
                username: 'admin1',
                password: '123456',
            };

            request(app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('message', 'Login successful');
                    expect(res.body).to.have.property('user');
                    expect(res.body.user).to.have.property('username', 'admin1');
                    expect(res.body.user).to.have.property('role', 'admin');
                    done();
                });
        });

        it('should return 401 if credentials are incorrect', (done) => {
            const credentials = {
                username: 'admin1',
                password: 'wrongpassword',
            };

            request(app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('message', 'Invalid username or password');
                    done();
                });
        });
    });
});