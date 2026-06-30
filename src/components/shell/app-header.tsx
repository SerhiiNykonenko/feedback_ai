import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";
import { LanguageSwitcher } from "./language-switcher";
import { LocalizedText } from "@/components/localized-text";
import { NotificationBell } from "./notification-bell";
import { AssistantChat } from "@/features/assistant/assistant-chat";

export function AppHeader({
  logoutAction,
  unreadNotificationCount,
  assistantEnabled
}: {
  logoutAction: () => Promise<void>;
  unreadNotificationCount: number;
  assistantEnabled: boolean;
}) {
  return (
    <header className="app-shell-header sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/95 px-4 shadow-sm backdrop-blur lg:px-6">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2">
        {assistantEnabled ? <AssistantChat /> : null}
        <NotificationBell initialCount={unreadNotificationCount} />
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
