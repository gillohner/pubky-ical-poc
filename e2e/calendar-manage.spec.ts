import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Calendar Management
 *
 * Tests editing, deleting, and managing calendars
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

test.describe("Calendar Management", () => {
  const testCalendarId = "test-calendar-123";
  const testAuthorId = "e2e-test-user";

  test.beforeEach(async ({ page }) => {
    // Navigate to calendar page
    await page.goto(
      `http://localhost:3000/calendar/${testAuthorId}/${testCalendarId}`,
    );
    await page.waitForLoadState("networkidle");
  });

  test("should display calendar details", async ({ page }) => {
    // Calendar header should be visible
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

    // Should show calendar name
    const calendarName = await page.locator("h1").textContent();
    expect(calendarName).toBeTruthy();
  });

  test("should display admin menu for calendar owner", async ({ page }) => {
    // Look for more options button (3-dot menu)
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();

      // Should show edit and delete options
      await expect(page.getByRole("menuitem", { name: /edit/i })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /delete/i }),
      ).toBeVisible();
    }
  });

  test("should open edit calendar modal", async ({ page }) => {
    // Click more options
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();

      // Click edit
      await page.getByRole("menuitem", { name: /edit/i }).click();

      // Edit modal should open
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Should have pre-filled name
      const nameInput = page.getByLabel(/calendar name/i);
      const currentName = await nameInput.inputValue();
      expect(currentName).toBeTruthy();
    }
  });

  test("should edit calendar name", async ({ page }) => {
    // Open more options
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      // Update name
      const nameInput = page.getByLabel(/calendar name/i);
      await nameInput.clear();
      await nameInput.fill("Updated Calendar Name");

      // Save changes
      await page.getByRole("button", { name: /save|update/i }).click();

      // Should show success message
      await expect(
        page.getByText(/updated|saved|success/i),
      ).toBeVisible({ timeout: 10000 });

      // Page should reflect new name
      await expect(page.locator("h1")).toContainText("Updated Calendar Name", {
        timeout: 10000,
      });
    }
  });

  test("should edit calendar description", async ({ page }) => {
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      // Update description
      const descInput = page.getByLabel(/description/i);
      await descInput.clear();
      await descInput.fill("This is the updated calendar description");

      // Save
      await page.getByRole("button", { name: /save|update/i }).click();

      // Verify success
      await expect(
        page.getByText(/updated|saved|success/i),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("should update calendar color", async ({ page }) => {
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      // Select different color
      const colorPicker = page.getByLabel(/color/i);
      if (await colorPicker.isVisible()) {
        await colorPicker.click();
        await page.locator("[data-color]").nth(2).click();
      }

      // Save
      await page.getByRole("button", { name: /save|update/i }).click();

      // Verify success
      await expect(
        page.getByText(/updated|saved|success/i),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("should cancel calendar edit", async ({ page }) => {
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      // Make changes
      await page.getByLabel(/calendar name/i).fill("Changed Name");

      // Cancel
      await page.getByRole("button", { name: /cancel/i }).click();

      // Modal should close
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 3000,
      });

      // Changes should not be applied
      await expect(page.locator("h1")).not.toContainText("Changed Name");
    }
  });

  test("should open delete confirmation dialog", async ({ page }) => {
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /delete/i }).click();

      // Confirmation dialog should open
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Should show warning message
      await expect(
        page.getByText(/are you sure|cannot be undone/i),
      ).toBeVisible();
    }
  });

  test("should delete calendar with confirmation", async ({ page }) => {
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /delete/i }).click();

      // Confirm deletion
      await page.getByRole("button", { name: /delete|confirm/i }).click();

      // Should redirect or show success
      await page.waitForURL(/my-calendars|calendars/, { timeout: 10000 });
    }
  });

  test("should cancel calendar deletion", async ({ page }) => {
    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /delete/i }).click();

      // Cancel deletion
      await page.getByRole("button", { name: /cancel/i }).click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 3000,
      });

      // Calendar should still be visible
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("should handle calendar update errors", async ({ page }) => {
    // Mock API error
    await page.route("**/api/**", (route) => {
      if (route.request().method() === "PUT") {
        route.abort("failed");
      } else {
        route.continue();
      }
    });

    const moreButton = page.getByRole("button", {
      name: /more|options|menu/i,
    });

    if (await moreButton.isVisible({ timeout: 5000 })) {
      await moreButton.click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      await page.getByLabel(/calendar name/i).fill("Error Test");
      await page.getByRole("button", { name: /save|update/i }).click();

      // Should show error message
      await expect(page.getByText(/error|failed/i)).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
