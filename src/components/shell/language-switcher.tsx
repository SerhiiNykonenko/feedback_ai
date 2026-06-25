"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={t("language")}
      title={t("language")}
      data-testid="language-switcher"
      onClick={() => setLocale(locale === "en" ? "uk" : "en")}
    >
      <Languages className="h-4 w-4" aria-hidden />
      {locale.toUpperCase()}
    </Button>
  );
}
