import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Calendar Creation
 *
 * Tests the complete flow of creating a new calendar
 */

// Mock authenticated state
test.use({
  storageState: {
    cookies: [
      {
        name: "pubky-auth-state",
        value: JSON.stringify({
          publicKey: "e2e-test-user",
          secretKey: "e2e-test-secret",
          capabilities: "/pub/pubky.app",
        }),
        domain: "localhost",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 86400,
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ],
    origins: [],
  },
});

test.describe("Calendar Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to my calendars page
    await page.goto("http://localhost:3000/my-calendars");
    await page.waitForLoadState("networkidle");
  });

  test("should display create calendar button", async ({ page }) => {
    const createButton = page.getByRole("button", {
      name: /create|new calendar/i,
    });
    await expect(createButton).toBeVisible();
  });

  test("should open calendar creation modal", async ({ page }) => {
    const createButton = page.getByRole("button", {
      name: /create|new calendar/i,
    });
    await createButton.click();

    // Modal should be visible
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Should have calendar name input
    const nameInput = page.getByLabel(/calendar name/i);
    await expect(nameInput).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|new calendar/i }).click();

    // Try to submit without name
    const submitButton = page.getByRole("button", { name: /create/i });
    await submitButton.click();

    // Should show validation error
    await expect(page.getByText(/name is required/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test("should create calendar with name only", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|new calendar/i }).click();

    // Fill calendar name
    const nameInput = page.getByLabel(/calendar name/i);
    await nameInput.fill("E2E Test Calendar");

    // Submit form
    const submitButton = page.getByRole("button", { name: /create/i });
    await submitButton.click();

    // Should show success message
    await expect(
      page.getByText(/calendar created|success/i),
    ).toBeVisible({ timeout: 10000 });

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("should create calendar with description", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|new calendar/i }).click();

    // Fill form
    await page.getByLabel(/calendar name/i).fill("Team Events");
    await page
      .getByLabel(/description/i)
      .fill("Calendar for team meetings and events");

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Verify success
    await expect(
      page.getByText(/calendar created|success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should create calendar with color selection", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|new calendar/i }).click();

    // Fill name
    await page.getByLabel(/calendar name/i).fill("Colored Calendar");

    // Select a color (if color picker exists)
    const colorPicker = page.getByLabel(/color/i);
    if (await colorPicker.isVisible()) {
      await colorPicker.click();
      // Select a color from palette
      await page.locator("[data-color]").first().click();
    }

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Verify success
    await expect(
      page.getByText(/calendar created|success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should upload calendar image", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|new calendar/i }).click();

    // Fill name
    await page.getByLabel(/calendar name/i).fill("Calendar with Image");

    // Upload image (if image upload exists)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Create a small test image buffer
      await fileInput.setInputFiles({
        name: "test-image.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake-image-data"),
      });

      // Wait for image preview
      await page.waitForSelector('img[alt*="preview"]', { timeout: 5000 });
    }

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Verify success
    await expect(
      page.getByText(/calendar created|success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should handle calendar creation errors gracefully", async ({
    page,
  }) => {
    // Mock API error by intercepting request
    await page.route("**/api/**", (route) => {
      route.abort("failed");
    });

    // Open modal and fill form
    await page.getByRole("button", { name: /create|new calendar/i }).click();
    await page.getByLabel(/calendar name/i).fill("Error Test Calendar");

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Should show error message
    await expect(page.getByText(/error|failed/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should cancel calendar creation", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|new calendar/i }).click();

    // Fill some data
    await page.getByLabel(/calendar name/i).fill("Cancelled Calendar");

    // Click cancel
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    // Modal should close without creating
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });

    // Calendar should not appear in list
    await expect(page.getByText("Cancelled Calendar")).not.toBeVisible();
  });

  test("should clear form when modal reopens", async ({ page }) => {
    // Open modal and fill form
    await page.getByRole("button", { name: /create|new calendar/i }).click();
    await page.getByLabel(/calendar name/i).fill("Test Calendar");

    // Cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Reopen modal
    await page.getByRole("button", { name: /create|new calendar/i }).click();

    // Form should be empty
    const nameInput = page.getByLabel(/calendar name/i);
    await expect(nameInput).toHaveValue("");
  });
});
