# Admin Module Tests

This directory contains comprehensive unit and integration tests for the Admin module.

## Test Coverage

### 1. Controller Tests (`admin.controller.test.ts`)
Tests all controller methods with various scenarios:

#### `createUser`
- ✅ Successfully creates a user with valid data
- ✅ Returns validation error for invalid data
- ✅ Handles errors during user creation
- ✅ Creates audit log after successful creation

#### `approveVendor`
- ✅ Successfully approves a pending vendor
- ✅ Returns 404 if vendor not found
- ✅ Returns error if user is not a vendor
- ✅ Returns error if vendor is already approved
- ✅ Handles validation errors
- ✅ Updates vendor profile verification status
- ✅ Creates audit log after approval

#### `suspendVendor`
- ✅ Successfully suspends a vendor
- ✅ Handles validation errors
- ✅ Handles errors during suspension
- ✅ Creates audit log after suspension

#### `listUsers`
- ✅ Lists users with default pagination (page 1, limit 10)
- ✅ Lists users with custom pagination and filters
- ✅ Properly calculates pagination metadata
- ✅ Handles errors during user listing

#### `getUserDetails`
- ✅ Gets details for a regular user
- ✅ Gets details for a vendor with profile
- ✅ Returns 404 if user not found
- ✅ Handles errors during retrieval

### 2. Routes Tests (`admin.routes.test.ts`)
Integration tests for all API endpoints:

#### Authentication & Authorization
- ✅ All routes require authentication
- ✅ All routes require ADMIN role

#### User Management Routes
- ✅ `POST /api/admin/users` - Creates user
- ✅ `GET /api/admin/users` - Lists users with pagination
- ✅ `GET /api/admin/users/:userId` - Gets user details

#### Vendor Management Routes
- ✅ `PUT /api/admin/vendors/:userId/approve` - Approves vendor
- ✅ `PUT /api/admin/vendors/:userId/suspend` - Suspends vendor

#### Device Token Admin Routes
- ✅ `GET /api/admin/device-tokens/stats` - Gets token statistics
- ✅ `POST /api/admin/device-tokens/cleanup` - Cleanup tokens

#### Additional Tests
- ✅ Validates HTTP method restrictions
- ✅ Verifies controller method bindings
- ✅ Tests query parameter passing

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Admin Module Tests Only
```bash
npm run test:admin
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Verbose Mode
```bash
npm run test:verbose
```

## Test Structure

```
admin/
├── __tests__/
│   ├── admin.controller.test.ts    # Unit tests for controller logic
│   ├── admin.routes.test.ts        # Integration tests for routes
│   └── README.md                   # This file
├── admin.controller.ts
└── admin.routes.ts
```

## Test Utilities

The tests use several utility functions from `src/tests/test-utils.ts`:

- `createMockRequest()` - Creates mock Express Request
- `createMockResponse()` - Creates mock Express Response
- `createMockAuthUser()` - Creates mock authenticated user
- `mockUsers` - Pre-configured user data generators
- `mockValidation` - Validation result helpers
- `assertSuccessResponse()` - Assert success response structure
- `assertErrorResponse()` - Assert error response structure

## Mocking Strategy

Tests use Jest mocks for:
- **Database (Prisma)** - Mocked in `src/tests/setup.ts`
- **Logger** - Mocked in `src/tests/setup.ts`
- **User Service** - Mocked per test file
- **Validators** - Mocked per test file
- **Middleware** - Mocked in route tests

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Adding New Tests

When adding new admin functionality:

1. **Add Controller Tests**: Test the business logic in isolation
2. **Add Route Tests**: Test the HTTP endpoint integration
3. **Update Test Utilities**: Add new mock data generators if needed
4. **Update This README**: Document new test cases

## Common Test Patterns

### Testing Controller Methods
```typescript
it('should handle success case', async () => {
  // Arrange - Setup mocks and data
  const mockData = { /* ... */ };
  (mockService.method as jest.Mock).mockResolvedValue(result);
  
  // Act - Call the controller method
  await controller.method(mockRequest, mockResponse);
  
  // Assert - Verify behavior
  expect(mockService.method).toHaveBeenCalledWith(expectedArgs);
  expect(mockResponse.status).toHaveBeenCalledWith(200);
});
```

### Testing Routes
```typescript
it('should call correct controller', async () => {
  // Arrange
  const mockController = jest.fn().mockImplementation((req, res) => {
    res.status(200).json({ success: true });
  });
  
  // Act
  const response = await request(app)
    .post('/api/admin/endpoint')
    .send(data);
  
  // Assert
  expect(mockController).toHaveBeenCalled();
  expect(response.status).toBe(200);
});
```

## Troubleshooting

### Tests Failing Due to Mocks
- Ensure mocks are cleared in `beforeEach()`: `jest.clearAllMocks()`
- Check mock return values match expected types
- Verify async operations are properly awaited

### Coverage Issues
- Check that all code paths are tested
- Add tests for error scenarios
- Test edge cases and boundary conditions

### TypeScript Errors
- Ensure all type definitions are imported
- Use proper typing for mock functions
- Check that test types match actual implementation

