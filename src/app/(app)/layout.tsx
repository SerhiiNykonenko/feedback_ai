import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { signOut } from "@/server/auth";
import { requireUser } from "@/server/auth/guards";
import { getUnreadNotificationCount } from "@/features/notifications/data";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadNotificationCount = user.permissions.includes("notifications.read")
    ? await getUnreadNotificationCount(user.id)
    : 0;

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        permissions={user.permissions}
        name={user.name}
        image={user.image}
        logoutAction={logoutAction}
      />
      <div className="min-w-0 flex-1">
        <AppHeader
          logoutAction={logoutAction}
          unreadNotificationCount={unreadNotificationCount}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
