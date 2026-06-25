import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/server/auth";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";
import { LanguageSwitcher } from "./language-switcher";
import { LocalizedText } from "@/components/localized-text";

export function AppHeader({ name }: { name?: string | null }) {
  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-6">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Notifications">
          <Link href="/profile">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            <LocalizedText textKey="signedIn" />
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm" aria-label="Sign out">
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">
              <LocalizedText textKey="signOut" />
            </span>
          </Button>
        </form>
      </div>
    </header>
  );
}
