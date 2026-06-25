"use server";

import { revalidatePath } from "next/cache";
import { createServerAction } from "@/server/actions/create-server-action";
import { prisma } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { canTransitionFeedback } from "@/domain/workflows";
import { answerValueSchema, questionTypeSchema } from "@/domain/question-validation";
import {
  commentSchema,
  requestFeedbackSchema,
  saveDraftSchema,
  submitFeedbackSchema,
  transitionFeedbackSchema
} from "./schemas";

const saveFeedbackDraftAction = createServerAction({
  permission: "feedback.write",
  schema: saveDraftSchema,
  rateLimitKey: "feedback.autosave",
  async handler(input, context) {
    const feedback = await prisma.feedback.findFirstOrThrow({
      where: { id: input.feedbackId, authorId: context.userId },
      include: {
        cycle: {
          include: { template: { include: { sections: { include: { questions: true } } } } }
        }
      }
    });

    const questions = new Map(
      feedback.cycle.template.sections
        .flatMap((section) => section.questions)
        .map((question) => [question.id, question])
    );

    const answeredQuestionIds = input.answers.map((answer) => answer.questionId);
    await prisma.$transaction([
      prisma.answer.deleteMany({
        where: {
          feedbackId: input.feedbackId,
          questionId: { notIn: answeredQuestionIds }
        }
      }),
      ...input.answers.map((answer) => {
        const question = questions.get(answer.questionId);
        if (!question) throw new Error("Unknown question");
        const parsedType = questionTypeSchema.parse(question.type);
        const options = Array.isArray(question.options) ? question.options.map(String) : [];
        const value = answerValueSchema(parsedType, options).parse(answer.value);
        return prisma.answer.upsert({
          where: {
            feedbackId_questionId: { feedbackId: input.feedbackId, questionId: answer.questionId }
          },
          update: { value, authorId: context.userId },
          create: {
            feedbackId: input.feedbackId,
            questionId: answer.questionId,
            authorId: context.userId,
            value
          }
        });
      })
    ]);

    const totalQuestions = questions.size || 1;
    const updated = await prisma.feedback.update({
      where: { id: input.feedbackId },
      data: {
        progress: Math.min(100, Math.round((input.answers.length / totalQuestions) * 100)),
        lastAutosavedAt: new Date()
      }
    });
    revalidatePath("/reviews");
    return updated;
  }
});

const submitFeedbackAction = createServerAction({
  permission: "feedback.submit",
  schema: submitFeedbackSchema,
  async handler(input, context) {
    const feedback = await prisma.feedback.findFirstOrThrow({
      where: { id: input.feedbackId, authorId: context.userId },
      include: {
        answers: true,
        cycle: {
          include: {
            template: {
              include: { sections: { include: { questions: true } } }
            }
          }
        }
      }
    });
    if (!canTransitionFeedback(feedback.status, "SUBMITTED"))
      throw new Error("Feedback is not ready to submit");
    const answeredIds = new Set(feedback.answers.map((answer) => answer.questionId));
    const missingRequired = feedback.cycle.template.sections
      .flatMap((section) => section.questions)
      .filter((question) => question.required && !answeredIds.has(question.id));
    if (missingRequired.length > 0)
      throw new Error(`${missingRequired.length} required answers are missing`);
    const updated = await prisma.feedback.update({
      where: { id: feedback.id },
      data: { status: "SUBMITTED", submittedAt: new Date(), progress: 100 }
    });
    await writeAuditLog({
      actorId: context.userId,
      action: "SUBMIT",
      entityType: "Feedback",
      entityId: feedback.id,
      summary: "Submitted feedback"
    });
    revalidatePath("/reviews");
    return updated;
  }
});

const addFeedbackCommentAction = createServerAction({
  permission: "feedback.write",
  schema: commentSchema,
  async handler(input, context) {
    const comment = await prisma.comment.create({
      data: {
        feedbackId: input.feedbackId,
        authorId: context.userId,
        body: input.body,
        mentions: { create: (input.mentions ?? []).map((userId) => ({ userId })) }
      }
    });
    revalidatePath("/reviews");
    return comment;
  }
});

const requestFeedbackAction = createServerAction({
  permission: "feedback.request",
  schema: requestFeedbackSchema,
  async handler(input, context) {
    const cycle = await prisma.reviewCycle.findUniqueOrThrow({
      where: { id: input.cycleId },
      include: {
        template: {
          include: {
            sections: {
              include: { questions: true },
              orderBy: { order: "asc" }
            }
          }
        }
      }
    });
    if (cycle.status !== "ACTIVE")
      throw new Error("Feedback can only be requested in an active cycle");
    const templateSnapshot = {
      id: cycle.template.id,
      name: cycle.template.name,
      version: cycle.template.version,
      sections: cycle.template.sections.map((section) => ({
        id: section.id,
        title: section.title,
        order: section.order,
        questions: section.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          type: question.type,
          required: question.required,
          options: question.options,
          order: question.order
        }))
      }))
    };
    const feedback = await prisma.feedback.create({
      data: {
        cycleId: cycle.id,
        requesterId: context.userId,
        subjectId: input.subjectId,
        authorId: input.authorId,
        templateSnapshot
      }
    });
    await prisma.notification.create({
      data: {
        userId: input.authorId,
        type: "feedback_requested",
        title: "Feedback requested",
        body: `You have a new feedback request in ${cycle.name}.`,
        href: `/reviews/${feedback.id}`
      }
    });
    await writeAuditLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Feedback",
      entityId: feedback.id,
      summary: "Requested feedback"
    });
    revalidatePath("/reviews");
    return feedback;
  }
});

const transitionFeedbackAction = createServerAction({
  permission: ["feedback.review.team", "feedback.approve", "feedback.publish"],
  schema: transitionFeedbackSchema,
  async handler(input, context) {
    const feedback = await prisma.feedback.findUniqueOrThrow({
      where: { id: input.feedbackId },
      include: { subject: true }
    });
    const permissionByTarget = {
      UNDER_REVIEW: "feedback.review.team",
      APPROVED: "feedback.approve",
      PUBLISHED: "feedback.publish"
    } as const;
    if (!context.permissions.includes(permissionByTarget[input.targetStatus]))
      throw new Error("Forbidden");
    if (
      input.targetStatus === "UNDER_REVIEW" &&
      !context.permissions.includes("cycles.manage.org") &&
      feedback.subject.teamId !== context.teamId
    ) {
      throw new Error("Managers can only review their own team");
    }
    if (!canTransitionFeedback(feedback.status, input.targetStatus)) {
      throw new Error(`Cannot transition ${feedback.status} to ${input.targetStatus}`);
    }
    const updated = await prisma.feedback.update({
      where: { id: feedback.id },
      data: {
        status: input.targetStatus,
        approverId: input.targetStatus === "APPROVED" ? context.userId : feedback.approverId,
        approvedAt: input.targetStatus === "APPROVED" ? new Date() : feedback.approvedAt,
        publishedAt: input.targetStatus === "PUBLISHED" ? new Date() : feedback.publishedAt
      }
    });
    await writeAuditLog({
      actorId: context.userId,
      action:
        input.targetStatus === "APPROVED"
          ? "APPROVE"
          : input.targetStatus === "PUBLISHED"
            ? "PUBLISH"
            : "UPDATE",
      entityType: "Feedback",
      entityId: feedback.id,
      summary: `Transitioned feedback to ${input.targetStatus}`
    });
    revalidatePath("/reviews");
    return updated;
  }
});

export async function saveFeedbackDraft(input: Parameters<typeof saveFeedbackDraftAction>[0]) {
  return saveFeedbackDraftAction(input);
}

export async function submitFeedback(input: Parameters<typeof submitFeedbackAction>[0]) {
  return submitFeedbackAction(input);
}

export async function addFeedbackComment(input: Parameters<typeof addFeedbackCommentAction>[0]) {
  return addFeedbackCommentAction(input);
}

export async function requestFeedback(input: Parameters<typeof requestFeedbackAction>[0]) {
  return requestFeedbackAction(input);
}

export async function transitionFeedback(input: Parameters<typeof transitionFeedbackAction>[0]) {
  return transitionFeedbackAction(input);
}
