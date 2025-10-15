# Testing Structure

This project uses a comprehensive testing setup with Jest, React Testing
Library, and Playwright.

## Test Types

### Unit Tests (Jest + React Testing Library)

Location: `src/**/__tests__/` or `*.test.ts(x)` files

**Purpose**: Test individual functions, utilities, and components in isolation.

**Run tests**:

```bash
npm test                  # Run all tests once
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
```

**Example locations**:

- `src/lib/__tests__/` - Utility function tests
- `src/components/__tests__/` - Component tests
- `src/__tests__/` - Application-level tests

### E2E Tests (Playwright)

Location: `e2e/`

**Purpose**: Test complete user flows in a real browser environment.

**Run tests**:

```bash
npm run test:e2e          # Run E2E tests in headless mode
npm run test:e2e:ui       # Run with Playwright UI
```

## Writing Tests

### Unit Test Example

```typescript
// src/lib/__tests__/myUtil.test.ts
import { myUtil } from "../myUtil";

describe("myUtil", () => {
  it("does something correctly", () => {
    expect(myUtil("input")).toBe("expected");
  });
});
```

### Component Test Example

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import MyComponent from "../MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

### Zustand Store Test Example

```typescript
// src/stores/__tests__/myStore.test.tsx
import { act, renderHook } from "@testing-library/react";
import { useMyStore } from "../myStore";

describe("useMyStore", () => {
  it("updates state correctly", () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.updateValue("new value");
    });

    expect(result.current.value).toBe("new value");
  });
});
```

### E2E Test Example

```typescript
// e2e/user-flow.spec.ts
import { expect, test } from "@playwright/test";

test.describe("User Flow", () => {
  test("completes checkout process", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Add to Cart");
    await page.click("text=Checkout");
    await expect(page).toHaveURL(/checkout/);
  });
});
```

## Configuration Files

- `jest.config.ts` - Jest configuration
- `jest.setup.ts` - Jest setup (testing-library/jest-dom)
- `playwright.config.ts` - Playwright configuration

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user experiences
2. **Keep tests simple** - One assertion per test when possible
3. **Use descriptive test names** - Clearly state what is being tested
4. **Arrange-Act-Assert** - Structure tests clearly
5. **Mock external dependencies** - Keep tests isolated and fast
6. **Test accessibility** - Use role-based queries in RTL
7. **Clean up after tests** - Reset state between tests

## Coverage

Coverage reports are generated in the `coverage/` directory when running:

```bash
npm run test:coverage
```
