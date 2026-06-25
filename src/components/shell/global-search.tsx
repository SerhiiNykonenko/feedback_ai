"use client";

import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

type SearchResult = { id: string; type: string; label: string; href: string };

export function GlobalSearch() {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(value.trim()), 250);
    return () => clearTimeout(timeout);
  }, [value]);

  const results = useQuery({
    queryKey: ["global-search", query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      return (await response.json()) as SearchResult[];
    }
  });

  return (
    <div className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-9"
        placeholder={t("searchPlaceholder")}
        aria-label="Global search"
      />
      {query.length >= 2 ? (
        <div className="absolute z-20 mt-2 w-full rounded-lg border bg-card p-2 shadow-soft">
          {results.isLoading ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">{t("searching")}</p>
          ) : null}
          {results.data?.length ? (
            results.data.map((result) => (
              <a
                key={`${result.type}-${result.id}`}
                href={result.href}
                className="block rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                <span className="font-medium">{result.label}</span>
                <span className="ml-2 text-xs uppercase text-muted-foreground">{result.type}</span>
              </a>
            ))
          ) : !results.isLoading ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">{t("noResults")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
