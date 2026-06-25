"use client";

import { useI18n } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";

export function LocalizedText({ textKey }: { textKey: TranslationKey }) {
  const { t } = useI18n();
  return <>{t(textKey)}</>;
}
