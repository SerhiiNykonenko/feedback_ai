"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";

type Profile = Awaited<ReturnType<typeof import("./data").getProfile>>;

export function ProfileView({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("profile")}</h1>
        <p className="text-sm text-muted-foreground">{t("profileSubtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{profile.name}</CardTitle>
          <CardDescription>
            {profile.title ?? "Employee"} - {profile.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile.roles.map((role) => (
              <Badge key={role.roleId}>{role.role.name}</Badge>
            ))}
            {profile.team ? <Badge>{profile.team.name}</Badge> : null}
            {profile.manager ? <Badge>Manager: {profile.manager.name}</Badge> : null}
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
            <div key={notification.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-sm text-muted-foreground">{notification.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
