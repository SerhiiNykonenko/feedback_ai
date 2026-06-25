"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-view";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { createTemplate, deleteTemplate } from "./actions";

type Templates = Awaited<ReturnType<typeof import("./data").getTemplates>>;

export function TemplatesView({ templates }: { templates: Templates }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? t("success") : (result.error ?? t("failed")));
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("templates")}</h1>
        <p className="text-sm text-muted-foreground">{t("templatesSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("createTemplate")}</CardTitle>
          <CardDescription>
            Start with one section and one question. More fields can be added after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 lg:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              run(() =>
                createTemplate({
                  name: String(form.get("name")),
                  description: String(form.get("description") || ""),
                  sections: [
                    {
                      title: String(form.get("sectionTitle")),
                      questions: [
                        {
                          prompt: String(form.get("questionPrompt")),
                          type: "LONG_TEXT",
                          required: true
                        }
                      ]
                    }
                  ]
                })
              );
              event.currentTarget.reset();
            }}
          >
            <Input name="name" placeholder={t("templateName")} required />
            <Input name="sectionTitle" placeholder={t("sectionTitle")} required />
            <Input name="questionPrompt" placeholder={t("questionPrompt")} required />
            <Button type="submit" disabled={pending}>
              {pending ? t("loading") : t("createTemplate")}
            </Button>
            <Textarea name="description" className="lg:col-span-4" placeholder={t("description")} />
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      {templates.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <Badge>{template.builtIn ? t("builtIn") : t("custom")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>
                    {template.sections.length} {t("sections")}
                  </Badge>
                  <Badge>
                    {template.sections.reduce((sum, section) => sum + section.questions.length, 0)}{" "}
                    {t("questions")}
                  </Badge>
                  <Badge>
                    {template._count.cycles} {t("cycles")}
                  </Badge>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {template.sections.slice(0, 6).map((section) => (
                    <li key={section.id}>{section.title}</li>
                  ))}
                </ul>
                {!template.builtIn ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={pending || template._count.cycles > 0}
                    onClick={() => run(() => deleteTemplate({ id: template.id }))}
                  >
                    {t("delete")}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No templates"
          description="Create reusable templates before launching review cycles."
        />
      )}
    </div>
  );
}
