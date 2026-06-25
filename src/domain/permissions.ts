export const PERMISSIONS = [
  { key: "dashboard.read", name: "Read dashboard", description: "View own dashboard." },
  {
    key: "feedback.request",
    name: "Request feedback",
    description: "Request feedback from another employee."
  },
  {
    key: "feedback.write",
    name: "Write feedback",
    description: "Create and autosave feedback drafts."
  },
  { key: "feedback.submit", name: "Submit feedback", description: "Submit feedback for review." },
  {
    key: "feedback.read.own",
    name: "Read own feedback",
    description: "View feedback received or authored by self."
  },
  {
    key: "feedback.review.team",
    name: "Review team feedback",
    description: "Review feedback for direct or team reports."
  },
  {
    key: "feedback.approve",
    name: "Approve feedback",
    description: "Approve feedback before publishing."
  },
  { key: "feedback.publish", name: "Publish feedback", description: "Publish approved feedback." },
  {
    key: "cycles.manage.team",
    name: "Manage team cycles",
    description: "Create and manage team review cycles."
  },
  {
    key: "cycles.manage.org",
    name: "Manage org cycles",
    description: "Launch organization review cycles."
  },
  {
    key: "templates.manage",
    name: "Manage templates",
    description: "Create, edit, and delete feedback templates."
  },
  {
    key: "analytics.read.employee",
    name: "Read employee analytics",
    description: "View own analytics."
  },
  { key: "analytics.read.team", name: "Read team analytics", description: "View team analytics." },
  {
    key: "analytics.read.org",
    name: "Read organization analytics",
    description: "View organization analytics."
  },
  {
    key: "notifications.read",
    name: "Read notifications",
    description: "View in-app notifications."
  },
  { key: "search.global", name: "Use global search", description: "Search authorized entities." },
  { key: "settings.manage.users", name: "Manage users", description: "Manage users and teams." },
  { key: "settings.manage.products", name: "Manage products", description: "Manage products." },
  {
    key: "settings.manage.permissions",
    name: "Manage permissions",
    description: "Manage role assignments."
  },
  { key: "audit.read", name: "Read audit logs", description: "View audit logs." }
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];
export type RoleKey = "employee" | "manager" | "hr" | "admin";

const employeePermissions = [
  "dashboard.read",
  "feedback.request",
  "feedback.write",
  "feedback.submit",
  "feedback.read.own",
  "analytics.read.employee",
  "notifications.read",
  "search.global"
] satisfies PermissionKey[];

export const ROLE_PERMISSION_KEYS = {
  employee: employeePermissions,
  manager: [
    ...employeePermissions,
    "feedback.review.team",
    "feedback.approve",
    "cycles.manage.team",
    "analytics.read.team"
  ],
  hr: [
    ...employeePermissions,
    "feedback.approve",
    "feedback.publish",
    "cycles.manage.org",
    "templates.manage",
    "analytics.read.team",
    "analytics.read.org",
    "settings.manage.permissions",
    "audit.read"
  ],
  admin: [
    ...employeePermissions,
    "feedback.review.team",
    "feedback.approve",
    "feedback.publish",
    "cycles.manage.team",
    "cycles.manage.org",
    "templates.manage",
    "analytics.read.team",
    "analytics.read.org",
    "settings.manage.users",
    "settings.manage.products",
    "settings.manage.permissions",
    "audit.read"
  ]
} satisfies Record<RoleKey, PermissionKey[]>;

export function roleHasPermission(role: RoleKey, permission: PermissionKey) {
  return (ROLE_PERMISSION_KEYS[role] as readonly PermissionKey[]).includes(permission);
}

export function hasAnyPermission(userPermissions: Iterable<string>, required: PermissionKey[]) {
  const owned = new Set(userPermissions);
  return required.some((permission) => owned.has(permission));
}
