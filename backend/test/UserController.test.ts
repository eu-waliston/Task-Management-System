import request from 'supertest';
import express, { NextFunction } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Database } from '../src/config/database';
import { userRoutes } from '../src/api/routes/userRoutes';
import { authenticateToken } from '../src/api/middleware/auth';

jest.mock('../../src/api/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

describe('User Controller Integration Tests', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    process.env.MONGODB_URI = mongoUri;
    process.env.DB_NAME = 'test_db';

    await Database.connect();

    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
  });

  afterAll(async () => {
    await Database.disconnect();
    await mongoServer.stop();
  });

  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'developer',
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(userData.email);
  });

  it('should return error for invalid user data', async () => {
    const invalidUserData = {
      email: 'invalid-email',
      password: 'short',
      firstName: 'John',
      // missing lastName and role
    };

    const response = await request(app)
      .post('/api/users')
      .send(invalidUserData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});