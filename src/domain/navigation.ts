import type { PermissionKey } from "./permissions";
import type { TranslationKey } from "@/lib/i18n";

export const navigationItems: Array<{
  href: string;
  labelKey: TranslationKey;
  permissions: PermissionKey[];
}> = [
  { href: "/dashboard", labelKey: "dashboard", permissions: ["dashboard.read"] },
  { href: "/reviews", labelKey: "reviews", permissions: ["feedback.read.own"] },
  { href: "/templates", labelKey: "templates", permissions: ["templates.manage"] },
  { href: "/analytics", labelKey: "analytics", permissions: ["analytics.read.employee"] },
  {
    href: "/settings",
    labelKey: "settings",
    permissions: [
      "settings.manage.users",
      "settings.manage.products",
      "settings.manage.permissions"
    ]
  },
  { href: "/profile", labelKey: "profile", permissions: ["dashboard.read"] }
];
