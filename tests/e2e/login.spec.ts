import { expect, test } from "@playwright/test";

test("login page exposes an accessible authentication form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /se connecter/i })).toBeVisible();
  await expect(page.getByLabel(/courriel/i)).toBeVisible();
  await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /connecter/i })).toBeVisible();
});
