import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";
import { LanguageSwitcher } from "./language-switcher";
import { LocalizedText } from "@/components/localized-text";

export function AppHeader({ logoutAction }: { logoutAction: () => Promise<void> }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/95 px-4 shadow-sm backdrop-blur lg:px-6">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Notifications">
          <Link href="/profile">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
        <form action={logoutAction} className="lg:hidden">
          <Button type="submit" variant="outline" size="icon" aria-label="Sign out">
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="sr-only">
              <LocalizedText textKey="signOut" />
            </span>
          </Button>
        </form>
      </div>
    </header>
  );
}
