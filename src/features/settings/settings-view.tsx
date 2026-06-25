"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { createProduct, createTeam, createUser, updateUserRole } from "./actions";

type SettingsData = Awaited<ReturnType<typeof import("./data").getSettingsData>>;

const selectClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SettingsView({ data, permissions }: { data: SettingsData; permissions: string[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const canManageUsers = permissions.includes("settings.manage.users");
  const canManageProducts = permissions.includes("settings.manage.products");
  const canManageRoles = permissions.includes("settings.manage.permissions");

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? t("success") : (result.error ?? t("failed")));
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("settings")}</h1>
        <p className="text-sm text-muted-foreground">{t("settingsSubtitle")}</p>
      </div>

      {message ? <p className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {canManageProducts ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("createProduct")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                data-testid="create-product-form"
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  runAction(() =>
                    createProduct({
                      name: String(form.get("name")),
                      description: String(form.get("description") || "")
                    })
                  );
                  event.currentTarget.reset();
                }}
              >
                <Input name="name" placeholder={t("name")} required />
                <Textarea name="description" placeholder={t("description")} />
                <Button type="submit" disabled={pending}>
                  {pending ? t("loading") : t("save")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {canManageUsers ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("createTeam")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  runAction(() =>
                    createTeam({
                      name: String(form.get("name")),
                      description: String(form.get("description") || ""),
                      productId: String(form.get("productId") || "")
                    })
                  );
                  event.currentTarget.reset();
                }}
              >
                <Input name="name" placeholder={t("name")} required />
                <select name="productId" className={selectClass} defaultValue="">
                  <option value="">{t("product")}</option>
                  {data.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={pending}>
                  {pending ? t("loading") : t("save")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {canManageUsers ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("createUser")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  runAction(() =>
                    createUser({
                      name: String(form.get("name")),
                      email: String(form.get("email")),
                      title: String(form.get("title") || ""),
                      password: String(form.get("password")),
                      teamId: String(form.get("teamId") || ""),
                      roleKey: String(form.get("roleKey")) as
                        | "employee"
                        | "manager"
                        | "hr"
                        | "admin"
                    })
                  );
                  event.currentTarget.reset();
                }}
              >
                <Input name="name" placeholder={t("name")} required />
                <Input name="email" type="email" placeholder={t("email")} required />
                <Input name="title" placeholder={t("title")} />
                <Input
                  name="password"
                  type="password"
                  placeholder={t("password")}
                  minLength={8}
                  required
                />
                <select name="teamId" className={selectClass} defaultValue="">
                  <option value="">{t("team")}</option>
                  {data.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <select name="roleKey" className={selectClass} defaultValue="employee">
                  {data.roles.map((role) => (
                    <option key={role.id} value={role.key}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={pending}>
                  {pending ? t("loading") : t("save")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("users")}</CardTitle>
            <CardDescription>{t("roles")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email} - {user.team?.name ?? t("team")}
                  </p>
                </div>
                {canManageRoles ? (
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                    value={user.roles[0]?.role.key ?? "employee"}
                    onChange={(event) =>
                      runAction(() =>
                        updateUserRole({
                          userId: user.id,
                          roleKey: event.target.value as "employee" | "manager" | "hr" | "admin"
                        })
                      )
                    }
                  >
                    {data.roles.map((role) => (
                      <option key={role.id} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role.roleId}>{role.role.name}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("products")} / {t("teams")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.products.map((product) => (
              <div key={product.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{product.name}</p>
                  <Badge>
                    {product._count.teams} {t("teams")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product._count.cycles} {t("cycles")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("auditTrail")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.auditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm">
              <span>{log.summary}</span>
              <Badge>{log.action.toLowerCase()}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
