export type FeedbackAnswerValue = string | number | boolean | string[];
export type FeedbackQuestionDescriptor = { id: string; type: string };

export function isCompletedAnswer(value: unknown, questionType?: string): value is FeedbackAnswerValue {
  if (questionType === "BOOLEAN") return typeof value === "boolean";
  if (questionType === "MULTI_SELECT") {
    return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string");
  }
  if (questionType?.startsWith("RATING")) return typeof value === "number" && Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string");
}

export function completedAnswers(
  answers: Record<string, unknown>,
  questions?: FeedbackQuestionDescriptor[]
) {
  const entries = questions
    ? questions.map((question) => [question.id, answers[question.id], question.type] as const)
    : Object.entries(answers).map(([questionId, value]) => [questionId, value, undefined] as const);

  return entries
    .filter(
      (entry): entry is readonly [string, FeedbackAnswerValue, string | undefined] =>
        isCompletedAnswer(entry[1], entry[2])
    )
    .map(([questionId, value]) => ({ questionId, value }));
}

export function calculateFeedbackProgress(
  answers: Record<string, unknown>,
  questions: FeedbackQuestionDescriptor[]
) {
  if (questions.length === 0) return 0;
  return Math.min(100, Math.round((completedAnswers(answers, questions).length / questions.length) * 100));
}
