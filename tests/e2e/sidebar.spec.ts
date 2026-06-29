import { expect, test } from "@playwright/test";

test("desktop sidebar can be collapsed and keeps its state after reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nykonenko_sv@groupbwt.com");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });

  const sidebar = page.locator("aside");
  await expect(sidebar).toHaveAttribute("data-collapsed", "false");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();

  await page.reload();
  await expect(page.locator("aside")).toHaveAttribute("data-collapsed", "true");
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.locator("aside")).toHaveAttribute("data-collapsed", "false");
});
