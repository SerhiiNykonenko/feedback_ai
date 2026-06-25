import { expect, test } from "@playwright/test";

test("employee can request, complete, and submit feedback", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("employee@example.com");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/reviews");

  const requestForm = page.getByTestId("request-feedback-form");
  await requestForm.locator('select[name="cycleId"]').selectOption({ index: 1 });
  await requestForm
    .locator('select[name="subjectId"]')
    .selectOption({ label: "Review subject: Elena Employee" });
  await requestForm.locator('select[name="authorId"]').selectOption({ label: "Elena Employee" });
  await requestForm.getByRole("button", { name: "Request feedback" }).click();
  await expect(page.getByText("Saved successfully")).toBeVisible();

  const task = page
    .getByTestId("feedback-task")
    .filter({ hasText: "Elena Employee → Elena Employee" })
    .first();
  await task.getByRole("link", { name: "Open form" }).click();

  const ratings = page.locator('input[type="number"]');
  for (let index = 0; index < (await ratings.count()); index += 1) {
    await ratings.nth(index).fill("4");
  }
  const evidence = page.locator("textarea");
  for (let index = 0; index < (await evidence.count()); index += 1) {
    await evidence.nth(index).fill(`Evidence ${index + 1}`);
  }

  await page.getByRole("button", { name: "Submit feedback" }).click();
  await page.goto("/reviews");
  await expect(page.getByText("submitted").first()).toBeVisible();
});
