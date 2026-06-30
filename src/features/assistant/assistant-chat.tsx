"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import type { AssistantMessage } from "./schemas";

function requestHistory(messages: AssistantMessage[]) {
  const selected: AssistantMessage[] = [];
  let characters = 0;
  for (let index = messages.length - 1; index >= 0 && selected.length < 10; index -= 1) {
    const message = messages[index];
    if (characters + message.content.length > 7000) break;
    selected.push(message);
    characters += message.content.length;
  }
  return selected.reverse();
}

export function AssistantChat() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;

    const nextMessages: AssistantMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestHistory(nextMessages) })
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: AssistantMessage; error?: string }
        | null;
      if (!response.ok || !result?.message) {
        throw new Error(result?.error ?? t("assistantUnavailable"));
      }
      setMessages((current) => [...current, result.message!]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("assistantUnavailable"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {open ? (
        <section
          className="fixed inset-x-3 bottom-3 top-20 z-50 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:bottom-auto sm:left-auto sm:right-5 sm:h-[min(36rem,calc(100vh-6rem))] sm:w-[25rem]"
          role="dialog"
          aria-label={t("aiAssistant")}
          aria-modal="false"
        >
          <header className="flex items-center gap-3 border-b bg-primary/5 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{t("aiAssistant")}</h2>
              <p className="truncate text-xs text-muted-foreground">Local OSS · Qwen3 4B</p>
            </div>
            {messages.length ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
                aria-label="Clear conversation"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close AI guide"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            <div className="mr-8 rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed">
              {t("assistantWelcome")}
            </div>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-8 whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground"
                    : "mr-8 whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed"
                }
              >
                {message.content}
              </div>
            ))}
            {pending ? (
              <div className="mr-8 flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Thinking locally…
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form className="border-t p-3" onSubmit={submit}>
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={t("askAssistant")}
                maxLength={1500}
                rows={2}
                disabled={pending}
                aria-label={t("askAssistant")}
              />
              <Button type="submit" size="icon" disabled={pending || !draft.trim()}>
                <Send className="h-4 w-4" aria-hidden />
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Product guidance only. Do not share private feedback or passwords.
            </p>
          </form>
        </section>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((current) => !current)}
        aria-label={t("aiAssistant")}
        aria-expanded={open}
        title={t("aiAssistant")}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <MessageCircle className="h-5 w-5" aria-hidden />}
      </Button>
    </>
  );
}
