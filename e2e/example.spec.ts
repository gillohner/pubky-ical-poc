import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("has title", async ({ page }) => {
    await page.goto("/");

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Next.js/);
  });

  test("navigates to homepage", async ({ page }) => {
    await page.goto("/");

    // Check if page loads successfully
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});
