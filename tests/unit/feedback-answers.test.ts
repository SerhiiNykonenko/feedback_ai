import { describe, expect, it } from "vitest";
import {
  calculateFeedbackProgress,
  completedAnswers,
  isCompletedAnswer
} from "@/domain/feedback-answers";

describe("feedback answers", () => {
  it("does not count registered but empty form fields as completed", () => {
    const answers = {
      text: "",
      whitespace: "   ",
      rating: Number.NaN,
      choices: []
    };

    expect(completedAnswers(answers)).toEqual([]);
    expect(
      calculateFeedbackProgress(answers, [
        { id: "text", type: "TEXT" },
        { id: "whitespace", type: "LONG_TEXT" },
        { id: "rating", type: "RATING_1_5" },
        { id: "choices", type: "MULTI_SELECT" }
      ])
    ).toBe(0);
  });

  it("counts valid values and treats an explicit false as a boolean answer", () => {
    expect(isCompletedAnswer(false, "BOOLEAN")).toBe(true);
    expect(isCompletedAnswer(false, "MULTI_SELECT")).toBe(false);
    expect(
      calculateFeedbackProgress(
        {
          text: "Useful feedback",
          rating: 4,
          boolean: false,
          choices: [],
          empty: ""
        },
        [
          { id: "text", type: "TEXT" },
          { id: "rating", type: "RATING_1_5" },
          { id: "boolean", type: "BOOLEAN" },
          { id: "choices", type: "MULTI_SELECT" },
          { id: "empty", type: "TEXT" }
        ]
      )
    ).toBe(60);
  });

  it("caps progress at 100 percent", () => {
    expect(
      calculateFeedbackProgress(
        { one: "yes", two: "yes" },
        [{ id: "one", type: "TEXT" }]
      )
    ).toBe(100);
  });
});
