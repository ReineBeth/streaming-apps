import { expect, test } from "@playwright/test";

test("roulette exposes filters and a session draw", async ({ page }) => {
  await page.goto("/roulette");

  await expect(page.getByRole("heading", { name: "Roulette" })).toBeVisible();
  await expect(page.getByRole("form", { name: /filtres de la roulette/i })).toBeVisible();
  await expect(page.getByLabel("Type")).toBeVisible();
  await expect(page.getByLabel("Mon statut")).toBeVisible();

  const drawButton = page.getByRole("button", { name: "Lancer la roulette" });
  await expect(drawButton).toBeVisible();
  await drawButton.click();
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /roulette choisit/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Re-roll" })).toBeVisible();
  await expect(page.getByRole("list", { name: /titres tir/i }).getByRole("listitem")).toHaveCount(1);

  const rerollButton = page.getByRole("button", { name: "Re-roll" });
  await expect(rerollButton).toBeEnabled();
  await rerollButton.click();
  await expect(page.getByRole("list", { name: /titres tir/i }).getByRole("listitem")).toHaveCount(2);
});

test("roulette skips the animation when reduced motion is enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/roulette");

  const drawButton = page.getByRole("button", { name: "Lancer la roulette" });
  await expect(drawButton).toBeVisible();
  await drawButton.click();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: /titre/i })).toBeVisible();
});
