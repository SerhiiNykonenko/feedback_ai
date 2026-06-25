import { expect, test } from "@playwright/test";

test("admin can create a product and switch language", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.setItem("feedback-locale", "en"));
  await page.reload();
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/settings");

  await page.getByTestId("language-switcher").click();
  await expect(page.getByRole("heading", { name: "Налаштування" })).toBeVisible();

  const productName = `E2E Product ${Date.now()}`;
  const productForm = page.getByTestId("create-product-form");
  await productForm.getByPlaceholder("Назва").fill(productName);
  await productForm.getByRole("button", { name: "Зберегти" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: productName })).toBeVisible();
});
