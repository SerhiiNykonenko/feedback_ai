"use client";

import Link from "next/link";
import { navigationItems } from "@/domain/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export function AppSidebar({ permissions }: { permissions: string[] }) {
  const { t } = useI18n();
  const visible = navigationItems.filter((item) =>
    item.permissions.some((permission) => permissions.includes(permission))
  );
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/50 lg:block">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard" className="text-sm font-semibold">
          Feedback AI
        </Link>
      </div>
      <nav className="space-y-1 p-3" aria-label="Primary">
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
