import { expect, test } from "@playwright/test";

test("employee can request, complete, and submit feedback", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nykonenko_sv@groupbwt.com");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/reviews");

  const requestForm = page.getByTestId("request-feedback-form");
  const taskCountBeforeRequest = await page.getByTestId("feedback-task").count();
  await requestForm.locator('select[name="cycleId"]').selectOption({ index: 1 });
  await requestForm
    .locator('select[name="subjectId"]')
    .selectOption({ label: "Review subject: Elena Employee" });
  await requestForm.locator('select[name="authorId"]').selectOption({ label: "Elena Employee" });
  await requestForm.getByRole("button", { name: "Request feedback" }).click();
  await expect(page.getByText("Saved successfully")).toBeVisible();
  await expect(page.getByTestId("feedback-task")).toHaveCount(taskCountBeforeRequest + 1);

  const task = page.getByTestId("feedback-task").filter({ hasText: "Elena Employee" }).first();
  await task.getByRole("link", { name: "Open form" }).click();

  const ratings = page.locator('input[type="number"]');
  await expect(page.getByText(/^0% complete/)).toBeVisible();
  await ratings.first().fill("4");
  await expect(page.getByText(/Unsaved changes|Saving draft/)).toBeVisible();
  await expect(page.getByText(/Draft saved automatically/)).toBeVisible();
  await page.reload();
  await expect(page.locator('input[type="number"]').first()).toHaveValue("4");
  await expect(page.getByText(/^0% complete/)).not.toBeVisible();

  for (let index = 0; index < (await ratings.count()); index += 1) {
    await ratings.nth(index).fill("4");
  }
  const evidence = page.locator("textarea");
  for (let index = 0; index < (await evidence.count()); index += 1) {
    await evidence.nth(index).fill(`Evidence ${index + 1}`);
  }

  const submitButton = page.getByRole("button", { name: "Submit feedback" });
  await submitButton.click();
  await expect(submitButton).toBeDisabled();
  await expect(submitButton).toBeHidden({ timeout: 15_000 });
  await page.goto("/reviews");
  await expect(page.getByText("submitted").first()).toBeVisible();
});
