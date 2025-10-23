# End-to-End Tests

Comprehensive E2E tests for the Pubky iCal application using Playwright.

## Test Suites

### 🔐 Authentication (`calendar-auth.spec.ts`)

Tests the complete authentication flow:

- Login dialog display and validation
- Signin URL processing
- User menu when authenticated
- Logout functionality
- Auth state persistence

### ➕ Calendar Creation (`calendar-create.spec.ts`)

Tests creating new calendars:

- Modal opening and form validation
- Creating calendars with various configurations
- Image upload functionality
- Error handling
- Form cancellation

### ✏️ Calendar Management (`calendar-manage.spec.ts`)

Tests managing existing calendars:

- Viewing calendar details
- Editing calendar properties
- Updating name, description, and color
- Deleting calendars with confirmation
- Error handling for updates

### 📅 Event Creation (`event-create.spec.ts`)

Tests creating events within calendars:

- Event form validation
- Simple and all-day events
- Events with descriptions and locations
- Recurring events
- Date/time validation
- Error handling

### 🔍 Calendar Discovery (`calendar-discovery.spec.ts`)

Tests browsing and discovering calendars:

- Public calendar listing
- Calendar detail views
- Navigation flows
- Loading and error states
- Search/filtering (if implemented)
- Authenticated vs unauthenticated views

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run specific test suite

```bash
npx playwright test e2e/calendar-auth.spec.ts
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

### Run tests with trace

```bash
npx playwright test --trace on
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit
- Timeout: 30s per test
- Retries: 2 (on CI)

## Prerequisites

1. **Start dev server** before running tests:
   ```bash
   npm run dev
   ```

2. **Ensure test data** is available (or mock API responses)

## Authentication in Tests

Tests that require authentication use mock storage state:

```typescript
test.use({
    storageState: {
        cookies: [{
            name: "pubky-auth-state",
            value: JSON.stringify({
                publicKey: "e2e-test-user",
                secretKey: "e2e-test-secret",
                capabilities: "/pub/pubky.app",
            }),
            // ...
        }],
        origins: [],
    },
});
```

## Best Practices

### ✅ Good Patterns

- Use `data-testid` attributes for reliable selectors
- Wait for `networkidle` before assertions
- Use `expect().toBeVisible({ timeout })` for async elements
- Test both happy paths and error cases
- Clean up test data after each test

### ❌ Avoid

- Hard-coded waits (`page.waitForTimeout()`)
- CSS selectors that might change
- Testing internal implementation details
- Relying on specific text that might change with i18n

## Debugging

### View test results

```bash
npx playwright show-report
```

### Debug specific test

```bash
npx playwright test --debug e2e/calendar-auth.spec.ts
```

### Generate test code

```bash
npx playwright codegen http://localhost:3000
```

## CI/CD Integration

Tests run automatically in CI with:

- 2 retries on failure
- Screenshots on failure
- Trace collection on failure
- Results uploaded as artifacts

## Coverage Goals

- [x] Authentication flows
- [x] Calendar CRUD operations
- [x] Event creation
- [x] Calendar discovery
- [ ] Event editing/deletion
- [ ] Admin management
- [ ] Export functionality (iCal)
- [ ] Error boundary testing

## Troubleshooting

### Tests failing locally?

1. Ensure dev server is running: `npm run dev`
2. Check for port conflicts (default: 3000)
3. Clear browser storage: `rm -rf ~/.cache/ms-playwright`
4. Update Playwright: `npx playwright install`

### Flaky tests?

1. Increase timeouts for slow operations
2. Use proper wait conditions (`waitForLoadState`)
3. Check for race conditions in app code
4. Add retry logic for unstable features

## Contributing

When adding new features:

1. Write E2E tests for critical user flows
2. Follow existing test patterns
3. Add appropriate `data-testid` attributes to components
4. Update this README with new test suites
