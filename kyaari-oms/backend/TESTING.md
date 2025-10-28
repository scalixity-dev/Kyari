# Testing Guide for Kyaari OMS Backend

This guide provides comprehensive information about testing the Kyaari OMS Backend application.

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [Best Practices](#best-practices)

## Overview

The backend uses **Jest** as the testing framework with **ts-jest** for TypeScript support. Tests are organized into unit tests and integration tests.

### Technology Stack
- **Jest**: Testing framework
- **ts-jest**: TypeScript preprocessor for Jest
- **Supertest**: HTTP assertions for integration tests
- **Mock implementations**: For Prisma, Logger, and external services

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install all testing dependencies including:
- `jest` - Testing framework
- `ts-jest` - TypeScript support
- `@types/jest` - TypeScript definitions
- `supertest` - HTTP testing
- `@types/supertest` - TypeScript definitions

### 2. Configuration Files

#### `jest.config.js`
Main Jest configuration file with:
- TypeScript support via ts-jest
- Test file patterns
- Coverage settings
- Module path mappings
- Setup files

#### `src/tests/setup.ts`
Global test setup with:
- Prisma client mocks
- Logger mocks
- Global configurations

#### `src/tests/test-utils.ts`
Reusable test utilities:
- Mock request/response creators
- Mock user generators
- Assertion helpers
- Common test data

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Module (e.g., Admin)
```bash
npm run test:admin
```

### Verbose Output
```bash
npm run test:verbose
```

### Single Test File
```bash
npm test -- admin.controller.test.ts
```

### With Pattern Matching
```bash
npm test -- --testNamePattern="createUser"
```

## Test Structure

### Directory Layout
```
backend/
├── jest.config.js                 # Jest configuration
├── src/
│   ├── tests/
│   │   ├── setup.ts              # Global test setup
│   │   └── test-utils.ts         # Test utilities
│   └── modules/
│       ├── admin/
│       │   ├── __tests__/
│       │   │   ├── admin.controller.test.ts
│       │   │   ├── admin.routes.test.ts
│       │   │   └── README.md
│       │   ├── admin.controller.ts
│       │   └── admin.routes.ts
│       └── [other-modules]/
└── coverage/                     # Generated coverage reports (git-ignored)
```

### Test File Naming
- Unit tests: `*.test.ts`
- Integration tests: `*.test.ts` (in same `__tests__` folder)
- All tests in `__tests__` directories

## Writing Tests

### Unit Test Example

```typescript
import { AdminController } from '../admin.controller';
import { userService } from '../../users/user.service';

// Mock dependencies
jest.mock('../../users/user.service');

describe('AdminController', () => {
  let controller: AdminController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new AdminController();
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = { role: 'VENDOR', name: 'Test', email: 'test@test.com' };
      mockRequest.body = userData;
      (userService.createUser as jest.Mock).mockResolvedValue({ user: { id: '123' } });

      // Act
      await controller.createUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(userData, expect.any(String), true);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import express from 'express';
import { adminRoutes } from '../admin.routes';

describe('Admin Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
  });

  it('should create user via POST /users', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .send({
        role: 'VENDOR',
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Using Test Utilities

```typescript
import { 
  createMockRequest, 
  createMockResponse,
  mockUsers,
  assertSuccessResponse 
} from '../../../tests/test-utils';

// Create mock request/response
const mockReq = createMockRequest({ body: { role: 'ADMIN' } });
const mockRes = createMockResponse();

// Use pre-configured mock data
const vendor = mockUsers.vendor(true); // verified vendor
const admin = mockUsers.admin();

// Assert response structure
assertSuccessResponse(mockRes.json, expectedData);
```

## Coverage

### Viewing Coverage

After running `npm run test:coverage`, open:
```
backend/coverage/lcov-report/index.html
```

### Coverage Thresholds

Current goals:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Coverage Reports Include:
- Overall project coverage
- Per-file coverage
- Uncovered lines highlighted
- Branch coverage details

## Module-Specific Tests

### Admin Module Tests

Location: `src/modules/admin/__tests__/`

**Controller Tests** (`admin.controller.test.ts`):
- ✅ createUser - Creates users with validation
- ✅ approveVendor - Vendor approval workflow
- ✅ suspendVendor - Vendor suspension
- ✅ listUsers - User listing with pagination
- ✅ getUserDetails - Fetch user details

**Route Tests** (`admin.routes.test.ts`):
- ✅ Authentication & authorization middleware
- ✅ All HTTP endpoints (POST, GET, PUT)
- ✅ Parameter passing
- ✅ Method bindings

See detailed coverage in: `src/modules/admin/__tests__/README.md`

## Best Practices

### 1. Test Organization
- Group related tests using `describe()` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Mock external dependencies (database, services)
- Clear mocks in `beforeEach()` to avoid test pollution
- Use `jest.clearAllMocks()` or `jest.resetAllMocks()`

### 3. Assertions
- Test both success and error scenarios
- Test edge cases and boundary conditions
- Verify all side effects (logs, database calls, etc.)

### 4. Async Testing
- Always use `async/await` for async operations
- Don't forget to `await` controller methods
- Set appropriate timeouts for long-running tests

### 5. Type Safety
- Use proper TypeScript types in tests
- Leverage `Partial<>` for mock objects
- Import types from actual implementations

### 6. Test Data
- Use test utilities for consistent mock data
- Avoid hardcoding values across multiple tests
- Create reusable data generators

## Common Patterns

### Testing Controller Methods
```typescript
describe('methodName', () => {
  it('should handle success case', async () => {
    // Arrange
    const inputData = { /* ... */ };
    mockRequest.body = inputData;
    (mockService.method as jest.Mock).mockResolvedValue(result);

    // Act
    await controller.methodName(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockService.method).toHaveBeenCalledWith(expectedArgs);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('should handle error case', async () => {
    // Arrange & Act
    (mockService.method as jest.Mock).mockRejectedValue(new Error('Test error'));
    await controller.methodName(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(logger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });
});
```

### Testing Routes
```typescript
describe('POST /endpoint', () => {
  it('should call controller method', async () => {
    const mockController = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app)
      .post('/api/admin/endpoint')
      .send(data)
      .expect(200);

    expect(mockController).toHaveBeenCalled();
  });
});
```

### Testing Validation
```typescript
it('should return validation error for invalid input', async () => {
  const invalidData = { /* invalid fields */ };
  mockRequest.body = invalidData;

  (validateSchema as jest.Mock).mockReturnValue({
    success: false,
    errors: { field: ['Error message'] }
  });

  await controller.method(mockRequest as Request, mockResponse as Response);

  expect(mockResponse.status).toHaveBeenCalledWith(422);
});
```

## Troubleshooting

### Issue: Tests failing with "Cannot find module"
**Solution**: Ensure all imports use correct paths and dependencies are installed

### Issue: Mocks not working
**Solution**: 
1. Check mock is defined before the test
2. Ensure mocks are cleared in `beforeEach()`
3. Verify mock implementation matches usage

### Issue: Async tests timing out
**Solution**:
1. Ensure all async operations are awaited
2. Increase timeout in `jest.config.js` or individual test
3. Check for unhandled promise rejections

### Issue: Coverage not updating
**Solution**:
1. Clear Jest cache: `npm test -- --clearCache`
2. Delete `coverage/` directory
3. Run tests again with coverage

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    cd backend
    npm test -- --coverage --ci
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    directory: ./backend/coverage
```

## Future Improvements

- [ ] Add E2E tests with actual database
- [ ] Implement mutation testing
- [ ] Add performance benchmarks
- [ ] Create visual regression tests
- [ ] Add contract tests for APIs

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Getting Help

For questions or issues:
1. Check this guide and module-specific READMEs
2. Review existing test files for examples
3. Consult team members
4. Create an issue in the project repository

