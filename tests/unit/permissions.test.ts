import { describe, expect, it } from "vitest";
import { hasAnyPermission, roleHasPermission } from "@/domain/permissions";
import { navigationItems } from "@/domain/navigation";

describe("role permissions", () => {
  it("allows employees to work with their own feedback but not org settings", () => {
    expect(roleHasPermission("employee", "feedback.submit")).toBe(true);
    expect(roleHasPermission("employee", "settings.manage.users")).toBe(false);
  });

  it("allows managers to approve team feedback", () => {
    expect(roleHasPermission("manager", "feedback.approve")).toBe(true);
    expect(roleHasPermission("manager", "analytics.read.team")).toBe(true);
  });

  it("allows HR to manage templates and organization analytics", () => {
    expect(roleHasPermission("hr", "templates.manage")).toBe(true);
    expect(roleHasPermission("hr", "analytics.read.org")).toBe(true);
  });

  it("allows admins to manage users and products", () => {
    expect(roleHasPermission("admin", "settings.manage.users")).toBe(true);
    expect(roleHasPermission("admin", "settings.manage.products")).toBe(true);
  });

  it("checks whether a user has any required permission", () => {
    expect(hasAnyPermission(["feedback.submit"], ["feedback.submit", "feedback.approve"])).toBe(
      true
    );
    expect(hasAnyPermission(["feedback.write"], ["settings.manage.users"])).toBe(false);
  });

  it("defines permission-backed navigation", () => {
    expect(navigationItems.map((item) => item.href)).toContain("/dashboard");
    expect(navigationItems.every((item) => item.permissions.length > 0)).toBe(true);
  });
});
