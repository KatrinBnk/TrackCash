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
});