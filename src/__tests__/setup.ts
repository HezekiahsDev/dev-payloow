import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { CONFIG } from '../config';

// In-memory MongoDB instance for testing
let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close mongoose connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  // Stop the in-memory MongoDB
  await mongoServer.stop();
});

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.PAYSTACK_SECRET_KEY = 'test-paystack-key';
