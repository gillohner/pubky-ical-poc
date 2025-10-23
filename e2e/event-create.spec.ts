import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Event Creation
 *
 * Tests creating events within calendars
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

test.describe("Event Creation", () => {
  // We'll use a test calendar - in real E2E, this would be created in beforeAll
  const testCalendarId = "test-calendar-123";
  const testAuthorId = "e2e-test-user";

  test.beforeEach(async ({ page }) => {
    // Navigate to calendar page
    await page.goto(
      `http://localhost:3000/calendar/${testAuthorId}/${testCalendarId}`,
    );
    await page.waitForLoadState("networkidle");
  });

  test("should display create event button on calendar page", async ({
    page,
  }) => {
    const createButton = page.getByRole("button", {
      name: /create|add event|new event/i,
    });
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test("should open event creation modal", async ({ page }) => {
    const createButton = page.getByRole("button", {
      name: /create|add event|new event/i,
    });
    await createButton.click();

    // Modal should be visible
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Should have event title input
    const titleInput = page.getByLabel(/event (title|name)/i);
    await expect(titleInput).toBeVisible();
  });

  test("should validate required event fields", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Try to submit without required fields
    const submitButton = page.getByRole("button", { name: /create|save/i });
    await submitButton.click();

    // Should show validation errors
    const errorMessage = page.getByText(/required|must|fill/i);
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test("should create simple event with title and date", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Fill required fields
    await page.getByLabel(/event (title|name)/i).fill("Team Meeting");
    await page.getByLabel(/start date|date/i).fill("2025-12-01");
    await page.getByLabel(/start time|time/i).fill("10:00");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Should show success message
    await expect(
      page.getByText(/event created|success/i),
    ).toBeVisible({ timeout: 10000 });

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("should create all-day event", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Fill fields
    await page.getByLabel(/event (title|name)/i).fill("Holiday");
    await page.getByLabel(/start date|date/i).fill("2025-12-25");

    // Check all-day checkbox
    const allDayCheckbox = page.getByLabel(/all.?day/i);
    if (await allDayCheckbox.isVisible()) {
      await allDayCheckbox.check();
    }

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Verify success
    await expect(
      page.getByText(/event created|success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should create event with description", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Fill fields
    await page.getByLabel(/event (title|name)/i).fill("Sprint Planning");
    await page.getByLabel(/start date|date/i).fill("2025-12-05");
    await page.getByLabel(/start time|time/i).fill("14:00");
    await page
      .getByLabel(/description/i)
      .fill("Quarterly sprint planning session");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Verify success
    await expect(
      page.getByText(/event created|success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should create event with location", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Fill fields
    await page.getByLabel(/event (title|name)/i).fill("Conference");
    await page.getByLabel(/start date|date/i).fill("2026-01-15");
    await page.getByLabel(/start time|time/i).fill("09:00");

    // Enter location
    const locationInput = page.getByLabel(/location/i);
    await locationInput.fill("Convention Center, San Francisco");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Verify success
    await expect(
      page.getByText(/event created|success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should create recurring event", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Fill basic fields
    await page.getByLabel(/event (title|name)/i).fill("Weekly Standup");
    await page.getByLabel(/start date|date/i).fill("2025-12-01");
    await page.getByLabel(/start time|time/i).fill("09:00");

    // Set recurrence
    const recurrenceSelect = page.getByLabel(/repeat|recurrence/i);
    if (await recurrenceSelect.isVisible()) {
      await recurrenceSelect.selectOption("weekly");
    }

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Verify success
    await expect(
      page.getByText(/event created|success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should validate event date range", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Fill with end date before start date
    await page.getByLabel(/event (title|name)/i).fill("Invalid Event");
    await page.getByLabel(/start date/i).fill("2025-12-10");
    await page.getByLabel(/end date/i).fill("2025-12-05");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Should show validation error
    await expect(
      page.getByText(/end.*before.*start|invalid date/i),
    ).toBeVisible({ timeout: 3000 });
  });

  test("should cancel event creation", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /create|add event/i }).click();

    // Fill some data
    await page.getByLabel(/event (title|name)/i).fill("Cancelled Event");

    // Click cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });

    // Event should not appear
    await expect(page.getByText("Cancelled Event")).not.toBeVisible();
  });

  test("should handle event creation errors", async ({ page }) => {
    // Mock API error
    await page.route("**/api/**", (route) => {
      route.abort("failed");
    });

    // Open modal and fill form
    await page.getByRole("button", { name: /create|add event/i }).click();
    await page.getByLabel(/event (title|name)/i).fill("Error Test Event");
    await page.getByLabel(/start date/i).fill("2025-12-01");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Should show error message
    await expect(page.getByText(/error|failed/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
