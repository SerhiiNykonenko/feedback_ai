"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { saveFeedbackDraft, submitFeedback } from "./actions";

type FeedbackQuestion = {
  id: string;
  prompt: string;
  type: string;
  required: boolean;
  options?: string[] | null;
};

type FeedbackSection = {
  id: string;
  title: string;
  questions: FeedbackQuestion[];
};

const formSchema = z.object({
  answers: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
});

type FormValues = z.infer<typeof formSchema>;

export function FeedbackForm({
  feedbackId,
  sections,
  initialAnswers = {},
  readOnly = false
}: {
  feedbackId: string;
  sections: FeedbackSection[];
  initialAnswers?: FormValues["answers"];
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  const questions = useMemo(() => sections.flatMap((section) => section.questions), [sections]);
  const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { answers: initialAnswers },
    mode: "onChange"
  });

  const autosave = useMutation({
    mutationFn: (values: FormValues) =>
      saveFeedbackDraft({
        feedbackId,
        answers: Object.entries(values.answers)
          .filter(([, value]) => {
            if (typeof value === "string") return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return typeof value === "number" ? !Number.isNaN(value) : typeof value === "boolean";
          })
          .map(([questionId, value]) => ({ questionId, value }))
      })
  });

  const submit = useMutation({
    mutationFn: async (values: FormValues) => {
      const answers = Object.entries(values.answers)
        .filter(([, value]) => {
          if (typeof value === "string") return value.trim().length > 0;
          if (Array.isArray(value)) return value.length > 0;
          return typeof value === "number" ? !Number.isNaN(value) : typeof value === "boolean";
        })
        .map(([questionId, value]) => ({ questionId, value }));
      const saved = await saveFeedbackDraft({ feedbackId, answers });
      if (!saved.ok) return saved;
      return submitFeedback({ feedbackId });
    }
  });
  const autosaveMutate = autosave.mutate;

  useEffect(() => {
    if (readOnly) return;
    const subscription = form.watch((values) => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
      autosaveTimeout.current = setTimeout(() => autosaveMutate(values as FormValues), 800);
    });
    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
      subscription.unsubscribe();
    };
  }, [autosaveMutate, form, readOnly]);

  const answered = Object.keys(form.watch("answers")).length;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => submit.mutate(values))}>
      <Card>
        <CardHeader>
          <CardTitle>{t("feedbackForm")}</CardTitle>
          <CardDescription>
            {progress}% {t("complete")} - {autosave.isPending ? t("savingDraft") : t("draftSaved")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <label className="text-sm font-medium" htmlFor={question.id}>
                  {question.prompt}
                </label>
                {question.type === "LONG_TEXT" ? (
                  <Textarea
                    id={question.id}
                    disabled={readOnly}
                    {...form.register(`answers.${question.id}`)}
                  />
                ) : question.type.startsWith("RATING") ? (
                  <Input
                    id={question.id}
                    type="number"
                    min={1}
                    max={question.type === "RATING_1_10" ? 10 : 5}
                    disabled={readOnly}
                    {...form.register(`answers.${question.id}`, { valueAsNumber: true })}
                  />
                ) : question.type === "MULTIPLE_CHOICE" ? (
                  <select
                    id={question.id}
                    disabled={readOnly}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    {...form.register(`answers.${question.id}`)}
                  >
                    <option value="">Select</option>
                    {question.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : question.type === "MULTI_SELECT" ? (
                  <div className="flex flex-wrap gap-3">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          value={option}
                          disabled={readOnly}
                          {...form.register(`answers.${question.id}`)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : question.type === "BOOLEAN" ? (
                  <input
                    id={question.id}
                    type="checkbox"
                    disabled={readOnly}
                    className="h-4 w-4"
                    {...form.register(`answers.${question.id}`)}
                  />
                ) : question.type === "EMOJI_SCALE" ? (
                  <select
                    id={question.id}
                    disabled={readOnly}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    {...form.register(`answers.${question.id}`)}
                  >
                    <option value="">Select</option>
                    {["terrible", "poor", "neutral", "good", "excellent"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={question.id}
                    disabled={readOnly}
                    {...form.register(`answers.${question.id}`)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {!readOnly ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={submit.isPending}>
            {t("submitFeedback")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
