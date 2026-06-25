import { describe, expect, it } from "vitest";
import {
  canTransitionCycle,
  canTransitionFeedback,
  validateWorkflowConfig,
  defaultWorkflowConfig
} from "@/domain/workflows";

describe("workflow policies", () => {
  it("enforces review cycle lifecycle order", () => {
    expect(canTransitionCycle("DRAFT", "ACTIVE")).toBe(true);
    expect(canTransitionCycle("DRAFT", "ARCHIVED")).toBe(false);
  });

  it("enforces feedback lifecycle order", () => {
    expect(canTransitionFeedback("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionFeedback("DRAFT", "PUBLISHED")).toBe(false);
  });

  it("validates required workflow states", () => {
    expect(validateWorkflowConfig(defaultWorkflowConfig)).toBe(true);
  });
});
