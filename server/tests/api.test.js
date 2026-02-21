const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Pet = require('../models/Pet');

describe('API Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/streetpaws_test');
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'OK');
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should login user', async () => {
      // First register
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      // Then login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('token');
    });
  });

  describe('Pets', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Register and login to get token
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      token = registerRes.body.data.token;
      userId = registerRes.body.data.user.id;
    });

    it('should create a new pet', async () => {
      const petData = {
        name: 'Fluffy',
        type: 'Cat',
        age: '2 years',
        location: 'Downtown',
        description: 'A cute cat looking for a home',
        contactNumber: '1234567890',
        contactName: 'John Doe'
      };

      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${token}`)
        .send(petData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', 'Fluffy');
    });

    it('should get all pets', async () => {
      // Create a pet first
      await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Fluffy',
          type: 'Cat',
          age: '2 years',
          location: 'Downtown',
          description: 'A cute cat looking for a home',
          contactNumber: '1234567890',
          contactName: 'John Doe'
        });

      const res = await request(app).get('/api/pets');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});