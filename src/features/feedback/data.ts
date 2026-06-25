import "server-only";
import { prisma } from "@/server/db";

export async function getFeedbackFormData(feedbackId: string, userId: string) {
  const feedback = await prisma.feedback.findFirstOrThrow({
    where: { id: feedbackId, authorId: userId },
    include: {
      subject: true,
      cycle: {
        include: {
          template: {
            include: {
              sections: {
                include: { questions: { orderBy: { order: "asc" } } },
                orderBy: { order: "asc" }
              }
            }
          }
        }
      },
      answers: true
    }
  });

  return {
    id: feedback.id,
    status: feedback.status,
    subjectName: feedback.subject.name,
    cycleName: feedback.cycle.name,
    sections: feedback.cycle.template.sections.map((section) => ({
      id: section.id,
      title: section.title,
      questions: section.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        required: question.required,
        options: Array.isArray(question.options) ? question.options.map(String) : null
      }))
    })),
    initialAnswers: Object.fromEntries(
      feedback.answers.flatMap((answer) => {
        const value = answer.value;
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          (Array.isArray(value) && value.every((item) => typeof item === "string"))
        ) {
          return [[answer.questionId, value] as const];
        }
        return [];
      })
    )
  };
}
