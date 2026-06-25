import { expect, test } from "@playwright/test";

const roles = [
  {
    email: "employee@example.com",
    allowed: ["/dashboard", "/reviews", "/analytics", "/profile"],
    forbidden: ["/templates", "/settings"]
  },
  {
    email: "manager@example.com",
    allowed: ["/dashboard", "/reviews", "/analytics", "/profile"],
    forbidden: ["/templates", "/settings"]
  },
  {
    email: "hr@example.com",
    allowed: ["/dashboard", "/reviews", "/templates", "/analytics", "/profile"],
    forbidden: ["/settings"]
  },
  {
    email: "admin@example.com",
    allowed: ["/dashboard", "/reviews", "/templates", "/analytics", "/settings", "/profile"],
    forbidden: []
  }
];

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

for (const role of roles) {
  test(`${role.email} route permissions`, async ({ page }) => {
    await login(page, role.email);
    for (const route of role.allowed) {
      await page.goto(route);
      await expect(page).not.toHaveURL(/login/);
    }
    for (const route of role.forbidden) {
      await page.goto(route);
      await expect(page).toHaveURL(/error=forbidden/);
    }
  });
}
