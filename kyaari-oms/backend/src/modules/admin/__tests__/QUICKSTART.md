# Quick Start - Admin Module Testing

## 📋 Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

## 🚀 Installation

### Step 1: Install Testing Dependencies
```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

Or if using the package.json already configured:
```bash
cd backend
npm install
```

### Step 2: Verify Installation
```bash
npm test -- --version
```

You should see Jest version information.

## 🧪 Running Tests

### Run All Admin Tests
```bash
npm run test:admin
```

### Run Specific Test File
```bash
npm test -- admin.controller.test.ts
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch -- --testPathPattern=admin
```

### With Coverage
```bash
npm run test:coverage -- --testPathPattern=admin
```

## 📊 Expected Output

### Successful Test Run
```
PASS  src/modules/admin/__tests__/admin.controller.test.ts
  AdminController
    createUser
      ✓ should create a user successfully (15ms)
      ✓ should return validation error for invalid data (5ms)
      ✓ should handle errors during user creation (4ms)
    approveVendor
      ✓ should approve a vendor successfully (8ms)
      ...

Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
Time:        3.456s
```

### Coverage Report
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
--------------------|---------|----------|---------|---------|-------------------
admin.controller.ts |   95.83 |    88.88 |     100 |   95.65 | 38,106
admin.routes.ts     |     100 |      100 |     100 |     100 |
--------------------|---------|----------|---------|---------|-------------------
```

## 🐛 Troubleshooting

### Error: Cannot find module 'jest'
```bash
npm install
```

### Error: Cannot find module 'supertest'
```bash
npm install --save-dev supertest @types/supertest
```

### Tests timing out
Increase timeout in `jest.config.js`:
```javascript
testTimeout: 10000, // 10 seconds
```

### Prisma errors in tests
Mocks are configured in `src/tests/setup.ts`. If issues persist:
```bash
npm run prisma:generate
```

## 📁 What Was Created

### Test Files
- ✅ `admin.controller.test.ts` - Unit tests for controller (28 tests)
- ✅ `admin.routes.test.ts` - Integration tests for routes (12 tests)

### Configuration Files
- ✅ `jest.config.js` - Jest configuration
- ✅ `src/tests/setup.ts` - Global test setup
- ✅ `src/tests/test-utils.ts` - Test utility functions

### Documentation
- ✅ `README.md` - Detailed test documentation
- ✅ `QUICKSTART.md` - This quick start guide
- ✅ `TESTING.md` - Comprehensive testing guide (in backend root)

### Package Updates
- ✅ Updated `package.json` with test scripts and dependencies

## 🎯 Next Steps

1. **Run the tests**: `npm run test:admin`
2. **Check coverage**: `npm run test:coverage`
3. **Add more tests**: Follow patterns in existing test files
4. **Read full docs**: See `README.md` and `TESTING.md`

## 💡 Quick Tips

### Run Single Test
```bash
npm test -- -t "should create a user successfully"
```

### Debug Tests
```bash
npm test -- --no-coverage --verbose
```

### Update Snapshots (if using)
```bash
npm test -- -u
```

### Clear Jest Cache
```bash
npm test -- --clearCache
```

## 📖 Learn More

- Full documentation: `README.md` (this directory)
- Testing guide: `../../../TESTING.md`
- Jest docs: https://jestjs.io/docs/getting-started

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Tests run successfully (`npm run test:admin`)
- [ ] Coverage report generated (`npm run test:coverage`)
- [ ] All 40+ tests passing
- [ ] Coverage > 80% for admin module

---

**Need Help?** Check the main `TESTING.md` guide or review existing test files for examples.

