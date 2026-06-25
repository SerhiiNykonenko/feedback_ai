import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./index";
import type { PermissionKey } from "@/domain/permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireUser();
  if (!user.permissions.includes(permission)) redirect("/dashboard?error=forbidden");
  return user;
}

export async function requireAnyPermission(permissions: PermissionKey[]) {
  const user = await requireUser();
  if (!permissions.some((permission) => user.permissions.includes(permission))) {
    redirect("/dashboard?error=forbidden");
  }
  return user;
}
