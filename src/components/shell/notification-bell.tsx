"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

const REFRESH_INTERVAL_MS = 30_000;

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const { t } = useI18n();

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
        credentials: "same-origin"
      });
      if (!response.ok) return;
      const data = (await response.json()) as { count: number };
      setCount(data.count);
    } catch {
      // Keep the latest known count while the network is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    window.addEventListener("notifications:changed", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("notifications:changed", refresh);
    };
  }, [refresh]);

  const accessibleLabel =
    count > 0 ? `${t("notifications")}: ${count} ${t("unread")}` : t("notifications");

  return (
    <Button asChild variant="ghost" size="icon" aria-label={accessibleLabel}>
      <Link className="relative" href="/profile#notifications">
        <Bell className="h-4 w-4" aria-hidden />
        {count > 0 ? (
          <span
            className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-card"
            aria-hidden
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
