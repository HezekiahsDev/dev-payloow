# Testing Guide

This project uses Jest for testing with TypeScript support and MongoDB Memory Server for database testing.

## Test Structure

```
src/
  __tests__/
    setup.ts              # Global test setup
    basic.test.ts         # Basic functionality tests
    unit/                 # Unit tests
      paystack.service.test.ts
    integration/          # Integration tests
      wallet.controller.test.ts
    service/              # Service layer tests
      wallet.service.test.ts
```

## Available Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific test file
npx jest src/__tests__/unit/paystack.service.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="verifyBvn"
```

## Test Types

### 1. Unit Tests

- Test individual functions/methods in isolation
- Mock external dependencies
- Fast execution
- Example: `src/__tests__/unit/paystack.service.test.ts`

### 2. Integration Tests

- Test how different parts work together
- Use real database (in-memory)
- Test API endpoints with real controllers
- Example: `src/__tests__/integration/wallet.controller.test.ts`

### 3. Service Tests

- Test business logic layer
- Mix of unit and integration testing
- Test service methods with database interactions
- Example: `src/__tests__/service/wallet.service.test.ts`

## Writing Tests

### Basic Test Structure

```typescript
describe('ServiceName', () => {
  // Setup before each test
  beforeEach(async () => {
    // Create test data
  });

  // Clean up after each test
  afterEach(async () => {
    // Clean up if needed
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange
      const testData = {
        /* test data */
      };

      // Act
      const result = await service.methodName(testData);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle error cases', async () => {
      // Arrange
      const invalidData = {
        /* invalid data */
      };

      // Act & Assert
      await expect(service.methodName(invalidData)).rejects.toThrow('Expected error message');
    });
  });
});
```

### Mocking External Services

```typescript
// Mock Paystack service
jest.mock('../../service/paystack.service', () => ({
  paystackService: {
    verifyBvn: jest.fn(),
    createDedicatedAccount: jest.fn(),
  },
}));

// Use in test
const { paystackService } = require('../../service/paystack.service');
paystackService.verifyBvn.mockResolvedValue({ status: true });
```

### Testing API Endpoints

```typescript
import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());
app.post('/api/endpoint', controller.method);

// Test the endpoint
const response = await request(app).post('/api/endpoint').send({ data: 'test' }).expect(200);

expect(response.body.message).toBe('Success');
```

## Test Database

Tests use MongoDB Memory Server for:

- ✅ Fast test execution
- ✅ Isolated test environment
- ✅ No external database dependency
- ✅ Automatic cleanup between tests

## Mocking Guidelines

1. **Mock External APIs**: Always mock third-party services (Paystack, AWS, etc.)
2. **Mock Heavy Dependencies**: Mock services that are slow or have side effects
3. **Don't Mock What You're Testing**: If testing a service, don't mock the service itself
4. **Use Real Database**: For integration tests, use the in-memory database

## Coverage Reports

Run `npm run test:coverage` to generate coverage reports:

- Terminal output shows coverage summary
- HTML report available in `coverage/lcov-report/index.html`
- LCOV report available in `coverage/lcov.info`

## Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Descriptive Test Names**: Use "should do X when Y" format
3. **One Assertion Per Test**: Keep tests focused
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Clean Up**: Use beforeEach/afterEach for consistent test state
6. **Mock External Dependencies**: Don't rely on external services in tests

## Debugging Tests

```bash
# Run specific test with debug info
npx jest --detectOpenHandles src/__tests__/basic.test.ts

# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run only failing tests
npx jest --onlyFailures
```

## Common Issues

### 1. MongoDB Connection Issues

- Ensure MongoDB Memory Server is properly set up in `setup.ts`
- Check that connections are properly closed in `afterAll`

### 2. Jest Timeouts

- Increase timeout in jest.config.js if tests are slow
- Use `--detectOpenHandles` to find hanging processes

### 3. Module Resolution

- Make sure imports use correct relative paths
- Check that mocks are in the right location

### 4. Async/Await Issues

- Always use `async/await` or return promises in tests
- Don't forget to await async operations

## Example Test Commands

```bash
# Quick test run
npm test

# Watch mode for development
npm run test:watch

# Full coverage report
npm run test:coverage

# Test specific service
npx jest wallet.service.test.ts

# Test with pattern matching
npx jest --testNamePattern="DVA"
```
