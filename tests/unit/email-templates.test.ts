import { describe, expect, it } from "vitest";
import { renderFeedbackRequestedEmail } from "@/features/notifications/email-templates";

describe("feedback requested email", () => {
  it("renders a usable text fallback and escapes dynamic HTML", () => {
    const email = renderFeedbackRequestedEmail({
      recipientName: "Elena <Employee>",
      requesterName: "Maks & Team",
      cycleName: "H1 Review",
      actionUrl: "https://feedback.example.com/reviews/feedback-1"
    });

    expect(email.text).toContain("Write feedback: https://feedback.example.com/reviews/feedback-1");
    expect(email.html).toContain("Elena &lt;Employee&gt;");
    expect(email.html).toContain("Maks &amp; Team");
    expect(email.html).not.toContain("Elena <Employee>");
  });
});
