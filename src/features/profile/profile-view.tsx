"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { AvatarUpload } from "./avatar-upload";
import { markNotificationRead } from "@/features/notifications/actions";
import { cn } from "@/lib/utils";

type Profile = Awaited<ReturnType<typeof import("./data").getProfile>>;

export function ProfileView({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openNotification(notification: Profile["notifications"][number]) {
    startTransition(async () => {
      if (notification.status === "UNREAD") {
        const result = await markNotificationRead({ id: notification.id });
        if (!result.ok) return;
        window.dispatchEvent(new Event("notifications:changed"));
      }
      if (notification.href) router.push(notification.href);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("profile")}</h1>
        <p className="text-sm text-muted-foreground">{t("profileSubtitle")}</p>
      </div>
      <Card id="notifications" className="scroll-mt-20">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
          <AvatarUpload name={profile.name} image={profile.image} />
          <div>
            <CardTitle className="text-xl">{profile.name}</CardTitle>
            <CardDescription className="mt-1">
              {profile.title ?? "Employee"} - {profile.email}
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <Badge key={role.roleId}>{role.role.name}</Badge>
              ))}
              {profile.team ? <Badge>{profile.team.name}</Badge> : null}
              {profile.manager ? <Badge>Manager: {profile.manager.name}</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
          <CardDescription>Recent in-app notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {profile.notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              disabled={pending}
              onClick={() => openNotification(notification)}
              className={cn(
                "relative block w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                notification.status === "UNREAD" && "border-primary/30 bg-primary/5"
              )}
            >
              {notification.status === "UNREAD" ? (
                <span
                  className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary"
                  aria-label={t("unread")}
                />
              ) : null}
              <p className="pr-6 text-sm font-medium">{notification.title}</p>
              <p className="text-sm text-muted-foreground">{notification.body}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
