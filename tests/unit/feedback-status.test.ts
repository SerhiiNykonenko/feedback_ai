import { describe, expect, it } from "vitest";
import {
  getFeedbackPrimaryAction,
  getFeedbackStatusMeta
} from "@/domain/feedback-status";

describe("feedback status presentation", () => {
  it.each([
    ["DRAFT", "Needs response", "Continue"],
    ["SUBMITTED", "Ready for review", "Review"],
    ["UNDER_REVIEW", "Manager review", "Approve"],
    ["APPROVED", "Approved", "Publish"],
    ["PUBLISHED", "Shared", "View"]
  ] as const)("maps %s to its label and primary action", (status, label, action) => {
    const meta = getFeedbackStatusMeta(status);

    expect(meta.label).toBe(label);
    expect(meta.description).not.toBe("");
    expect(meta.tone).toContain("dark:");
    expect(getFeedbackPrimaryAction(status)).toBe(action);
  });

  it("uses safe defaults for an unknown status", () => {
    expect(getFeedbackStatusMeta("UNKNOWN")).toEqual(getFeedbackStatusMeta("DRAFT"));
    expect(getFeedbackPrimaryAction("UNKNOWN")).toBe("View");
  });
});
