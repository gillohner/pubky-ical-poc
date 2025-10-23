import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Authentication Flow
 *
 * Tests the complete login and logout flow for the calendar application
 */

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto("http://localhost:3000");
  });

  test("should display login dialog when accessing protected routes", async ({
    page,
  }) => {
    // Try to access my calendars (protected route)
    await page.goto("http://localhost:3000/my-calendars");

    // Should show auth dialog or redirect to home
    const authButton = page.getByRole("button", { name: /sign in/i });
    await expect(authButton).toBeVisible({ timeout: 5000 });
  });

  test("should open auth dialog from navigation", async ({ page }) => {
    // Click Sign In button in navigation
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await signInButton.click();

    // Auth dialog should open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Should show signin URL input
    const input = page.getByPlaceholder(/signin url/i);
    await expect(input).toBeVisible();
  });

  test("should validate signin URL format", async ({ page }) => {
    // Open auth dialog
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await signInButton.click();

    // Try invalid URL
    const input = page.getByPlaceholder(/signin url/i);
    await input.fill("invalid-url");

    const continueButton = page.getByRole("button", { name: /continue/i });
    await continueButton.click();

    // Should show validation error
    await expect(page.getByText(/invalid url/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test("should process valid signin URL", async ({ page }) => {
    // Open auth dialog
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await signInButton.click();

    // Enter valid signin URL (mock format)
    const input = page.getByPlaceholder(/signin url/i);
    await input.fill(
      "pubkyauth:///?caps=/pub/pubky.app&secret=test-secret&pubkey=test-pubkey",
    );

    const continueButton = page.getByRole("button", { name: /continue/i });
    await continueButton.click();

    // Should redirect to callback page
    await expect(page).toHaveURL(/\/auth\/callback/, { timeout: 5000 });
  });

  test("should show user menu when authenticated", async ({
    page,
    context,
  }) => {
    // Set mock auth state in localStorage
    await context.addCookies([
      {
        name: "pubky-auth-state",
        value: JSON.stringify({
          publicKey: "test-user-pubkey",
          secretKey: "test-secret-key",
          capabilities: "/pub/pubky.app",
        }),
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.reload();

    // Should show user menu instead of sign in button
    const userButton = page.getByRole("button", {
      name: /account|profile|menu/i,
    });
    await expect(userButton).toBeVisible({ timeout: 5000 });
  });

  test("should logout successfully", async ({ page, context }) => {
    // Set mock auth state
    await context.addCookies([
      {
        name: "pubky-auth-state",
        value: JSON.stringify({
          publicKey: "test-user-pubkey",
          secretKey: "test-secret-key",
          capabilities: "/pub/pubky.app",
        }),
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.reload();

    // Click user menu
    const userButton = page.getByRole("button", {
      name: /account|profile|menu/i,
    });
    await userButton.click();

    // Click logout
    const logoutButton = page.getByRole("menuitem", { name: /sign out/i });
    await logoutButton.click();

    // Should show sign in button again
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible({ timeout: 3000 });
  });

  test("should persist auth state across page reloads", async ({
    page,
    context,
  }) => {
    // Set mock auth state
    await context.addCookies([
      {
        name: "pubky-auth-state",
        value: JSON.stringify({
          publicKey: "test-user-pubkey",
          secretKey: "test-secret-key",
          capabilities: "/pub/pubky.app",
        }),
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.reload();

    // Verify logged in
    await expect(
      page.getByRole("button", { name: /account|profile|menu/i }),
    ).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(
      page.getByRole("button", { name: /account|profile|menu/i }),
    ).toBeVisible();
  });
});
