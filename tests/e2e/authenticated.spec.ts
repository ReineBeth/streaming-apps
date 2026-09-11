import { expect, test } from "@playwright/test";

test("Watchlist exposes type, platform and genre filters", async ({ page }) => {
  await page.goto("/watchlist");

  const filterForm = page.getByRole("form", { name: /filtrer ma liste à voir/i });
  await expect(filterForm).toBeVisible();
  await expect(filterForm.getByLabel("Type")).toBeVisible();
  await expect(filterForm.getByLabel("Plateforme")).toBeVisible();
  await expect(filterForm.getByLabel("Genre")).toBeVisible();

  await filterForm.getByLabel("Type").selectOption("movie");
  await filterForm.getByRole("button", { name: "Appliquer" }).click();
  await expect(page).toHaveURL(/type=movie/);
});

test("Explorer exposes filters and title details", async ({ page }) => {
  await page.goto("/explorer?q=Ted");
  await expect(page.getByRole("heading", { name: "Explorer" })).toBeVisible();
  await expect(page.getByRole("search", { name: /filtrer le catalogue/i })).toBeVisible();
  await expect(page.getByLabel("Rechercher")).toBeVisible();
  await expect(page.getByLabel("Mon statut")).toBeVisible();

  await page.getByLabel("Rechercher").fill("Ted");
  await page.getByRole("button", { name: "Appliquer" }).click();
  await expect(page).toHaveURL(/q=Ted/);

  const firstCard = page.locator("article").filter({ has: page.getByRole("button", { name: /voir les détails/i }) }).first();
  await expect(firstCard).toBeVisible();
  await firstCard.getByRole("button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button", { name: /fermer/i })).toBeFocused();
  await page.getByRole("dialog").getByLabel("Mon statut").selectOption("watched");
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("dialog").getByLabel("Mon statut")).toHaveValue("watched");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(firstCard.getByRole("button")).toBeFocused();
});

test("Explorer resets filters and keeps the filter controls keyboard accessible", async ({ page }) => {
  await page.goto("/explorer?q=Ted&type=movie&page=2");

  const filterForm = page.getByRole("search", { name: /filtrer le catalogue/i });
  await expect(filterForm).toBeVisible();
  await expect(page.getByLabel("Rechercher")).toHaveValue("Ted");
  await expect(page.getByLabel("Type")).toHaveValue("movie");

  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await expect(page).toHaveURL(/\/explorer(?:\?|$)/);
  await expect(page.getByLabel("Rechercher")).toHaveValue("");
  await expect(page.getByLabel("Type")).toHaveValue("all");
  await expect(filterForm).toHaveAttribute("aria-busy", "false");

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("Explorer modal restores focus after keyboard dismissal", async ({ page }) => {
  await page.goto("/explorer?q=Ted");
  const cardButton = page.getByRole("button", { name: /voir les détails/i }).first();
  await expect(cardButton).toBeVisible();

  await cardButton.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /fermer/i })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(cardButton).toBeFocused();
});

test("title details save status, rating, and season state", async ({ page }) => {
  await page.goto("/explorer?q=Ted");
  const firstCard = page.locator("article").filter({ has: page.getByRole("button", { name: /voir les détails/i }) }).first();
  await expect(firstCard).toBeVisible();
  await firstCard.getByRole("button").click();
  await page.getByRole("dialog").getByRole("link", { name: /fiche|saisons/i }).click();

  await expect(page.getByLabel("Mon statut")).toBeVisible();
  await expect(page.getByLabel("Mon statut")).toHaveValue("watched");
  await page.getByRole("button", { name: "Enregistrer" }).first().click();
  await expect(page.getByLabel("Ma note")).toBeVisible();

  await page.getByLabel("Ma note").selectOption("very_good");
  await page.getByRole("button", { name: "Noter" }).click();
  await expect(page.getByLabel("Ma note")).toHaveValue("very_good");

  const seasonStatus = page.locator('select[id^="season-status-"]').first();
  if (await seasonStatus.count()) {
    await seasonStatus.selectOption("watched");
    await page.locator('select[id^="season-rating-"]').first().selectOption("masterpiece");
    await page.getByRole("button", { name: "Enregistrer les saisons" }).click();
    await expect(page.locator('select[id^="season-rating-"]').first()).toHaveValue("masterpiece");

    await seasonStatus.selectOption("abandoned");
    await page.locator('select[id^="season-rating-"]').first().selectOption("");
    await page.getByRole("button", { name: "Enregistrer les saisons" }).click();
  }

  await page.getByLabel("Mon statut").selectOption("abandoned");
  await page.getByRole("button", { name: "Enregistrer" }).first().click();

});
