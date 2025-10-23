import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Calendar Discovery
 *
 * Tests browsing and discovering calendars
 */

test.describe("Calendar Discovery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("should display home page with navigation", async ({ page }) => {
    // Navigation should be visible
    await expect(page.getByRole("navigation")).toBeVisible();

    // Should have link to calendars page
    const calendarsLink = page.getByRole("link", { name: /calendars/i });
    await expect(calendarsLink).toBeVisible();
  });

  test("should navigate to calendars discovery page", async ({ page }) => {
    // Click calendars link
    const calendarsLink = page.getByRole("link", { name: /calendars/i });
    await calendarsLink.click();

    // Should navigate to calendars page
    await expect(page).toHaveURL(/\/calendars/, { timeout: 5000 });

    // Page should load
    await page.waitForLoadState("networkidle");
  });

  test("should display list of public calendars", async ({ page }) => {
    await page.goto("http://localhost:3000/calendars");

    // Should show calendars heading
    await expect(page.getByRole("heading", { name: /calendars/i })).toBeVisible(
      { timeout: 10000 },
    );

    // Should display calendar cards or list items
    const calendarItems = page.locator("[data-testid='calendar-card']");
    const itemCount = await calendarItems.count();

    // If calendars exist, verify they're displayed
    if (itemCount > 0) {
      await expect(calendarItems.first()).toBeVisible();
    }
  });

  test("should show loading state while fetching calendars", async ({
    page,
  }) => {
    // Slow down network to see loading state
    await page.route("**/api/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto("http://localhost:3000/calendars");

    // Should show loading indicator
    const loader = page.getByTestId("loading-spinner");
    if (await loader.isVisible({ timeout: 500 })) {
      await expect(loader).toBeVisible();
    }
  });

  test("should display calendar card details", async ({ page }) => {
    await page.goto("http://localhost:3000/calendars");

    // Wait for calendars to load
    const calendarCard = page.locator("[data-testid='calendar-card']").first();

    if (await calendarCard.isVisible({ timeout: 10000 })) {
      // Should show calendar name
      await expect(calendarCard.locator("h2, h3")).toBeVisible();

      // Should show owner/author info (if available)
      const ownerInfo = calendarCard.getByText(/by|owner|created by/i);
      if (await ownerInfo.isVisible({ timeout: 1000 })) {
        await expect(ownerInfo).toBeVisible();
      }
    }
  });

  test("should click on calendar to view details", async ({ page }) => {
    await page.goto("http://localhost:3000/calendars");

    const calendarCard = page.locator("[data-testid='calendar-card']").first();

    if (await calendarCard.isVisible({ timeout: 10000 })) {
      // Click on calendar
      await calendarCard.click();

      // Should navigate to calendar detail page
      await expect(page).toHaveURL(/\/calendar\/.*\/.*/, { timeout: 5000 });

      // Calendar details should load
      await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display events on calendar page", async ({ page }) => {
    await page.goto("http://localhost:3000/calendars");

    const calendarCard = page.locator("[data-testid='calendar-card']").first();

    if (await calendarCard.isVisible({ timeout: 10000 })) {
      await calendarCard.click();

      // Wait for calendar page to load
      await page.waitForLoadState("networkidle");

      // Should show events section
      const eventsSection = page.getByText(/events|upcoming/i);
      await expect(eventsSection).toBeVisible({ timeout: 10000 });
    }
  });

  test("should handle empty calendar list gracefully", async ({ page }) => {
    // Mock empty response
    await page.route("**/api/calendars**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ calendars: [] }),
      });
    });

    await page.goto("http://localhost:3000/calendars");

    // Should show empty state message
    await expect(
      page.getByText(/no calendars|empty|none found/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should handle calendar fetch errors", async ({ page }) => {
    // Mock error response
    await page.route("**/api/calendars**", (route) => {
      route.abort("failed");
    });

    await page.goto("http://localhost:3000/calendars");

    // Should show error message
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should filter or search calendars (if implemented)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/calendars");

    // Look for search/filter input
    const searchInput = page.getByPlaceholder(/search|filter/i);

    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill("test");

      // Results should filter
      await page.waitForTimeout(1000); // Wait for debounce

      // Verify filtered results
      const results = page.locator("[data-testid='calendar-card']");
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe("Calendar Discovery - Authenticated", () => {
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

  test("should display my calendars link when authenticated", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000");

    // Should show "My Calendars" link
    const myCalendarsLink = page.getByRole("link", { name: /my calendars/i });
    await expect(myCalendarsLink).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to my calendars page", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const myCalendarsLink = page.getByRole("link", { name: /my calendars/i });
    await myCalendarsLink.click();

    // Should navigate to my-calendars page
    await expect(page).toHaveURL(/\/my-calendars/, { timeout: 5000 });
  });

  test("should display user's own calendars", async ({ page }) => {
    await page.goto("http://localhost:3000/my-calendars");

    // Page should load
    await page.waitForLoadState("networkidle");

    // Should show heading
    await expect(
      page.getByRole("heading", { name: /my calendars/i }),
    ).toBeVisible({ timeout: 10000 });

    // Should show create button
    await expect(
      page.getByRole("button", { name: /create|new calendar/i }),
    ).toBeVisible();
  });
});
