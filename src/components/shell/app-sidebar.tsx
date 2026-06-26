"use client";

import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Rows3,
  Settings,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { navigationItems } from "@/domain/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { LocalizedText } from "@/components/localized-text";
import { UserAvatar } from "@/components/user-avatar";
import Image from "next/image";

const navigationIcons = {
  "/dashboard": LayoutDashboard,
  "/reviews": ClipboardList,
  "/templates": Rows3,
  "/analytics": BarChart3,
  "/settings": Settings,
  "/profile": UserRound
} as const;

export function AppSidebar({
  permissions,
  name,
  image,
  logoutAction
}: {
  permissions: string[];
  name?: string | null;
  image?: string | null;
  logoutAction: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(window.localStorage.getItem("feedback-sidebar-collapsed") === "true");
  }, []);
  const visible = navigationItems.filter((item) =>
    item.permissions.some((permission) => permissions.includes(permission))
  );

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("feedback-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
      data-collapsed={collapsed}
    >
      <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center" : "px-3")}>
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <Image src="/brand/bwt-logo.png" alt="BWT" width={62} height={31} priority />
            <span className="text-sm font-semibold">Feedback</span>
          </Link>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(!collapsed && "ml-auto")}
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
        {visible.map((item) => {
          const Icon = navigationIcons[item.href as keyof typeof navigationIcons];
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className={cn(collapsed && "sr-only")}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={cn("border-t p-3", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="mb-3 flex min-w-0 items-center gap-3 px-2">
            <UserAvatar name={name} image={image} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">
                <LocalizedText textKey="signedIn" />
              </p>
            </div>
          </div>
        ) : (
          <UserAvatar name={name} image={image} className="mx-auto mb-3 h-9 w-9" />
        )}
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size={collapsed ? "icon" : "md"}
            className={cn(collapsed ? "w-full" : "w-full justify-start")}
            aria-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed ? <LocalizedText textKey="signOut" /> : null}
          </Button>
        </form>
      </div>
    </aside>
  );
}
