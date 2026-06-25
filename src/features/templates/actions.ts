"use server";

import { revalidatePath } from "next/cache";
import { createServerAction } from "@/server/actions/create-server-action";
import { prisma } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { deleteTemplateSchema, templateSchema } from "./schemas";

const createTemplateAction = createServerAction({
  permission: "templates.manage",
  schema: templateSchema,
  async handler(input, context) {
    const template = await prisma.feedbackTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        sections: {
          create: input.sections.map((section, sectionIndex) => ({
            title: section.title,
            order: sectionIndex + 1,
            questions: {
              create: section.questions.map((question, questionIndex) => ({
                prompt: question.prompt,
                type: question.type,
                required: question.required,
                options: question.options,
                order: questionIndex + 1
              }))
            }
          }))
        }
      }
    });
    await writeAuditLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "FeedbackTemplate",
      entityId: template.id,
      summary: `Created template ${template.name}`
    });
    revalidatePath("/templates");
    return template;
  }
});

const deleteTemplateAction = createServerAction({
  permission: "templates.manage",
  schema: deleteTemplateSchema,
  async handler(input, context) {
    const template = await prisma.feedbackTemplate.findUniqueOrThrow({
      where: { id: input.id },
      include: { _count: { select: { cycles: true } } }
    });
    if (template.builtIn) throw new Error("Built-in templates cannot be deleted");
    if (template._count.cycles > 0) throw new Error("Template is used by a review cycle");
    await prisma.feedbackTemplate.delete({ where: { id: template.id } });
    await writeAuditLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "FeedbackTemplate",
      entityId: template.id,
      summary: `Deleted template ${template.name}`
    });
    revalidatePath("/templates");
    return { id: template.id };
  }
});

export async function createTemplate(input: Parameters<typeof createTemplateAction>[0]) {
  return createTemplateAction(input);
}

export async function deleteTemplate(input: Parameters<typeof deleteTemplateAction>[0]) {
  return deleteTemplateAction(input);
}
