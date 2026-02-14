# Testing Patterns

**Analysis Date:** 2026-02-14

## Test Framework

**Runner:**
- Vitest 4.0.18
- Config: `packages/backend/vitest.config.ts`

**Assertion Library:**
- Vitest built-in (expect API)

**Additional Tools:**
- Supertest 7.2.2 - HTTP integration testing
- Vitest mocking via `vi`

**Run Commands:**
```bash
npm run test                  # Run all tests (from root or backend package)
npm run test:watch            # Watch mode (backend package only)
```

## Test File Organization

**Location:**
- Backend only - no frontend tests detected
- Tests co-located in `packages/backend/src/__tests__/` directory
- Production code in `packages/backend/src/` remains separate

**Naming:**
- Pattern: `*.test.ts`
- Route tests: `<resource>.routes.test.ts` (e.g., `charge.routes.test.ts`)
- Middleware tests: `<middleware>.middleware.test.ts` (e.g., `auth.middleware.test.ts`)

**Structure:**
```
packages/backend/src/
├── __tests__/
│   ├── charge.routes.test.ts
│   ├── category.routes.test.ts
│   ├── credential.routes.test.ts
│   ├── netWorth.routes.test.ts
│   ├── summary.routes.test.ts
│   └── auth.middleware.test.ts
├── controllers/
├── services/
├── middleware/
└── routes/
```

## Test Structure

**Suite Organization:**
```typescript
describe("Charge Routes", () => {
    // Shared setup
    const chargesCol = mocks.getCollection("charges");

    beforeEach(() => {
        // Reset mocks before each test
    });

    describe("PUT /api/charge/new", () => {
        it("creates a new charge successfully", async () => {
            // Arrange
            chargesCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            // Act
            const res = await request(app)
                .put("/api/charge/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(chargePayload);

            // Assert
            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Charge Created");
            expect(chargesCol.insertOne).toHaveBeenCalled();
        });
    });
});
```

**Patterns:**
- Nested `describe` blocks: outer for route group, inner for specific endpoint
- Comments separate test groups: `// ─── Create Charge ──────────────────────────────────────────`
- Each HTTP method tested in separate `describe` block
- Test names follow "should do X when Y" pattern without "should" prefix
- Arrange-Act-Assert pattern (implicit, not commented)

## Mocking

**Framework:** Vitest `vi` module

**Patterns:**

**1. Hoisted Module Mocks:**
```typescript
const mocks = vi.hoisted(() => {
    const collections: Record<string, any> = {};
    const getCollection = (name: string) => {
        if (!collections[name]) {
            collections[name] = {
                findOne: vi.fn(),
                insertOne: vi.fn(),
                updateOne: vi.fn(),
                deleteOne: vi.fn(),
                find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
                aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
            };
        }
        return collections[name];
    };
    return { mongoClient: { db: vi.fn(() => ({ collection: vi.fn((name: string) => getCollection(name)) })) }, getCollection, collections };
});

vi.mock("../mongo.database", () => ({
    mongoClient: mocks.mongoClient,
    connectMongo: vi.fn(),
}));
```

**2. External Library Mocks:**
```typescript
vi.mock("bcrypt", () => {
    const mock = {
        genSalt: vi.fn().mockResolvedValue("$2b$10$testsalt"),
        hash: vi.fn().mockResolvedValue("$2b$10$hashedpassword"),
        compare: vi.fn().mockResolvedValue(true),
    };
    return { ...mock, default: mock };
});
```

**3. Mock Reset in beforeEach:**
```typescript
beforeEach(() => {
    for (const col of Object.values(mocks.collections)) {
        for (const fn of Object.values(col as Record<string, any>)) {
            if (fn && typeof (fn as any).mockReset === "function") {
                (fn as any).mockReset();
            }
        }
        col.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
        col.aggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
    }
});
```

**What to Mock:**
- MongoDB client and collections (`packages/backend/src/mongo.database.ts`)
- bcrypt for password hashing (always mocked in tests)
- External dependencies loaded at app initialization

**What NOT to Mock:**
- Express app itself (imported directly)
- Route handlers and controllers (tested through integration)
- JWT library (used for real token generation/verification in tests)

## Fixtures and Factories

**Test Data:**
```typescript
// Helper function to generate auth tokens
function authToken(id?: string) {
    return jwt.sign(
        { id: id ?? new ObjectId().toString(), username: "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}

// Inline test payloads
const chargePayload = {
    userId: new ObjectId().toString(),
    categoryId: new ObjectId().toString(),
    description: "Grocery shopping",
    amount: 50.25,
    date: "2024-01-15",
};
```

**Location:**
- Test data defined inline within test files
- Helper functions defined at module level (before `describe` blocks)
- No separate fixtures directory

**Pattern:**
- Factory functions for reusable data (e.g., `authToken()`)
- Inline objects for request payloads
- Fresh ObjectIds generated per test: `new ObjectId()`

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage script configured
# Would need to add to package.json:
# "test:coverage": "vitest run --coverage"
```

**Current State:**
- No coverage reporting enabled
- No coverage thresholds set
- Tests focus on happy path and error cases

## Test Types

**Unit Tests:**
- Middleware tests (e.g., `packages/backend/src/__tests__/auth.middleware.test.ts`)
- Tests individual function behavior in isolation
- Uses mock request/response objects:
  ```typescript
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
      mockReq = { get: vi.fn(), app: { locals: { JWT_SECRET } } };
      mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      mockNext = vi.fn();
  });
  ```

**Integration Tests:**
- Route tests (all `*.routes.test.ts` files)
- Tests full request/response cycle through Express app
- Uses supertest to make HTTP requests
- Database layer mocked, but controllers/routes/middleware are real
- Example: `packages/backend/src/__tests__/charge.routes.test.ts`

**E2E Tests:**
- Not used

## Common Patterns

**Async Testing:**
```typescript
it("creates a new charge successfully", async () => {
    chargesCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

    const res = await request(app)
        .put("/api/charge/new")
        .set("Authorization", `Bearer ${authToken()}`)
        .send(chargePayload);

    expect(res.status).toBe(201);
});
```
- All route tests use async/await
- No manual promise handling or `.then()` chains
- Mock resolved values with `.mockResolvedValue()`

**Error Testing:**
```typescript
it("returns 404 when creation fails", async () => {
    chargesCol.insertOne.mockRejectedValue(new Error("Insert failed"));

    const res = await request(app)
        .put("/api/charge/new")
        .set("Authorization", `Bearer ${authToken()}`)
        .send(chargePayload);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Charge Create Failed");
});
```
- Mock rejections with `.mockRejectedValue()`
- Assert on error status codes and response bodies

**Authentication Testing:**
```typescript
it("returns 401 without authentication", async () => {
    const res = await request(app)
        .put("/api/charge/new")
        .send(chargePayload);

    expect(res.status).toBe(401);
});
```
- Every protected route tested with and without auth
- Helper function generates valid JWT tokens
- Auth middleware tested independently

**Mock Verification:**
```typescript
it("converts string IDs to ObjectIds before inserting", async () => {
    chargesCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

    await request(app)
        .put("/api/charge/new")
        .set("Authorization", `Bearer ${authToken()}`)
        .send(chargePayload);

    const insertArg = chargesCol.insertOne.mock.calls[0][0];
    expect(insertArg.userId).toBeInstanceOf(ObjectId);
    expect(insertArg.categoryId).toBeInstanceOf(ObjectId);
});
```
- Inspect mock call arguments to verify transformations
- Use `.mock.calls[index][argIndex]` to access call data

## Environment Configuration

**Test Environment Variables:**
Set in `packages/backend/vitest.config.ts`:
```typescript
env: {
    JWT_SECRET: "test-jwt-secret",
    USERS_COLLECTION_NAME: "users",
    CREDS_COLLECTION_NAME: "user_credentials",
    CHARGES_COLLECTION_NAME: "charges",
    CATEGORIES_COLLECTION_NAME: "categories",
    NETWORTH_COLLECTION_NAME: "networth",
    STATIC_DIR: "/tmp",
}
```

**Why This Matters:**
- Tests run with isolated environment variables
- No `.env` file loaded during tests
- Consistent test JWT secret for token verification

## Frontend Testing

**Current State:**
- No frontend tests detected
- No test framework configured for React components
- Potential gap in test coverage

**If Added, Use:**
- React Testing Library (not installed)
- Vitest (already available)
- User-centric testing patterns

---

*Testing analysis: 2026-02-14*
