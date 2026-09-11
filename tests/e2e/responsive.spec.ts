import { expect, test } from "@playwright/test";

test("Explorer remains usable on compact screens", async ({ page }) => {
  await page.goto("/explorer?q=Ted");

  await expect(page.getByRole("heading", { name: "Explorer" })).toBeVisible();
  await expect(page.getByRole("search", { name: /filtrer le catalogue/i })).toBeVisible();
  await expect(page.getByLabel("Rechercher")).toBeVisible();
  await page.getByRole("button", { name: "Recherche avancée" }).click();
  await expect(page.getByLabel("Type")).toBeVisible();
  await expect(page.getByLabel("Service")).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();

  const burger = page.getByRole("button", { name: /ouvrir le menu/i });
  const mobileNavigation = page.getByRole("navigation", { name: "Navigation mobile" });
  if (test.info().project.name === "mobile") {
    await expect(burger).toBeVisible();
    await expect(mobileNavigation).toBeHidden();
    await burger.click();
    await expect(page.getByRole("button", { name: /fermer le menu/i })).toBeVisible();
    await expect(mobileNavigation).toBeVisible();
  } else {
    await expect(burger).toBeHidden();
    await expect(mobileNavigation).toBeHidden();
  }

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasHorizontalOverflow).toBe(false);

  await page.goto("/roulette");
  await expect(page.getByRole("form", { name: /filtres de la roulette/i })).toBeVisible();
  await expect(page.getByLabel("Note TMDB minimale")).toBeVisible();
  const hasRouletteOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasRouletteOverflow).toBe(false);
});
