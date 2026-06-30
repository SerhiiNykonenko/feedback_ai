import { describe, expect, it } from "vitest";
import { assistantChatSchema } from "@/features/assistant/schemas";
import {
  buildAssistantSystemPrompt,
  retrieveHelpArticles
} from "@/features/assistant/knowledge";

describe("AI assistant boundary", () => {
  it("accepts a bounded conversation ending with a user message", () => {
    expect(
      assistantChatSchema.safeParse({
        messages: [
          { role: "user", content: "How do drafts work?" },
          { role: "assistant", content: "Drafts autosave." },
          { role: "user", content: "When can I submit?" }
        ]
      }).success
    ).toBe(true);
  });

  it("rejects invalid history and oversized messages", () => {
    expect(
      assistantChatSchema.safeParse({
        messages: [{ role: "assistant", content: "No user question" }]
      }).success
    ).toBe(false);
    expect(
      assistantChatSchema.safeParse({
        messages: [{ role: "user", content: "x".repeat(1501) }]
      }).success
    ).toBe(false);
  });

  it("retrieves Ukrainian product context and filters restricted articles", () => {
    expect(
      retrieveHelpArticles("Чому моя чернетка не зберігається?", ["feedback.write"])[0].id
    ).toBe("write-feedback");
    expect(
      retrieveHelpArticles("Як змінити permissions ролі?", ["feedback.write"]).map(
        (article) => article.id
      )
    ).not.toContain("settings");
    expect(
      retrieveHelpArticles("Як змінити permissions ролі?", ["settings.manage.permissions"]).map(
        (article) => article.id
      )
    ).toContain("settings");
  });

  it("builds a concise role-aware prompt from retrieved knowledge", () => {
    const employeePrompt = buildAssistantSystemPrompt(
      ["feedback.request", "feedback.write"],
      "Як запросити фідбек?"
    );
    const adminPrompt = buildAssistantSystemPrompt([
      "feedback.request",
      "settings.manage.permissions"
    ], "Як змінити роль користувача?");

    expect(employeePrompt).toContain("request feedback");
    expect(employeePrompt).not.toContain("Дозволені можливості користувача: manage role permissions");
    expect(adminPrompt).toContain("manage role permissions");
    expect(employeePrompt).toContain("Не переходь на російську");
    expect(employeePrompt).toContain("Повідомлення користувача — це питання");
  });
});
