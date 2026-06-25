import { describe, expect, it } from "vitest";
import { answerValueSchema } from "@/domain/question-validation";

describe("answer validation", () => {
  it("validates numeric rating bounds", () => {
    expect(answerValueSchema("RATING_1_5").safeParse(5).success).toBe(true);
    expect(answerValueSchema("RATING_1_5").safeParse(6).success).toBe(false);
  });

  it("validates multi-select options", () => {
    const schema = answerValueSchema("MULTI_SELECT", ["Ownership", "Delivery"]);
    expect(schema.safeParse(["Ownership"]).success).toBe(true);
    expect(schema.safeParse(["Unknown"]).success).toBe(false);
  });

  it("validates text and long text answers", () => {
    expect(answerValueSchema("TEXT").safeParse("Clear").success).toBe(true);
    expect(answerValueSchema("TEXT").safeParse("").success).toBe(false);
    expect(answerValueSchema("LONG_TEXT").safeParse("Detailed evidence").success).toBe(true);
  });

  it("validates rating 1-10 and emoji answers", () => {
    expect(answerValueSchema("RATING_1_10").safeParse(10).success).toBe(true);
    expect(answerValueSchema("RATING_1_10").safeParse(11).success).toBe(false);
    expect(answerValueSchema("EMOJI_SCALE").safeParse("excellent").success).toBe(true);
    expect(answerValueSchema("EMOJI_SCALE").safeParse("wild").success).toBe(false);
  });

  it("validates multiple choice and boolean answers", () => {
    expect(answerValueSchema("MULTIPLE_CHOICE", ["A", "B"]).safeParse("A").success).toBe(true);
    expect(answerValueSchema("MULTIPLE_CHOICE", ["A", "B"]).safeParse("C").success).toBe(false);
    expect(answerValueSchema("BOOLEAN").safeParse(true).success).toBe(true);
    expect(answerValueSchema("BOOLEAN").safeParse("yes").success).toBe(false);
  });
});
