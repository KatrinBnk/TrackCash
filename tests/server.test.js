import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';

describe('Auth API', () => {
    describe('POST /api/auth/register', () => {
        it('should allow admin to register a new user', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const newUser = { username: 'manager1', password: '654321', role: 'manager' };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .post('/api/auth/register')
                        .set('Authorization', `Bearer ${token}`)
                        .send(newUser)
                        .expect(201)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'User registered successfully');
                            expect(res.body.user).to.have.property('username', 'manager1');
                            expect(res.body.user).to.have.property('role', 'manager');
                            done();
                        });
                });
        });

        it('should return 403 if non-admin tries to register a user', (done) => {
            const managerCredentials = { username: 'manager1', password: '654321' };
            const newUser = { username: 'employee1', password: '789101', role: 'employee' };

            request(app)
                .post('/api/auth/login')
                .send(managerCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .post('/api/auth/register')
                        .set('Authorization', `Bearer ${token}`)
                        .send(newUser)
                        .expect(403)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Admin access required');
                            done();
                        });
                });
        });

        it('should return 400 if username already exists', (done) => {
            const adminCredentials = { username: 'admin1', password: '123456' };
            const duplicateUser = { username: 'manager1', password: '654321', role: 'manager' };

            request(app)
                .post('/api/auth/login')
                .send(adminCredentials)
                .end((err, loginRes) => {
                    if (err) return done(err);
                    const token = loginRes.body.token;

                    request(app)
                        .post('/api/auth/register')
                        .set('Authorization', `Bearer ${token}`)
                        .send(duplicateUser)
                        .expect(400)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property('message', 'Username already exists');
                            done();
                        });
                });
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login a user and return a token', (done) => {
            const credentials = { username: 'admin1', password: '123456' };

            request(app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('message', 'Login successful');
                    expect(res.body).to.have.property('token').that.is.a('string');
                    expect(res.body.user).to.have.property('username', 'admin1');
                    expect(res.body.user).to.have.property('role', 'admin');
                    done();
                });
        });

        it('should return 401 if credentials are incorrect', (done) => {
            const credentials = { username: 'admin1', password: 'wrongpassword' };

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