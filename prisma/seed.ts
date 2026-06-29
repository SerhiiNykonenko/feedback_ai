import {
  PrismaClient,
  QuestionType,
  CycleType,
  CycleStatus,
  FeedbackStatus,
  type Prisma
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_PERMISSION_KEYS } from "../src/domain/permissions";
import { defaultWorkflowConfig } from "../src/domain/workflows";

const prisma = new PrismaClient();

const templateDefinitions = [
  {
    name: "General Performance",
    description: "Broad performance review across communication, ownership, and execution.",
    sections: [
      "Communication",
      "Technical Skills",
      "Ownership",
      "Teamwork",
      "Leadership",
      "Problem Solving"
    ]
  },
  {
    name: "QA",
    description: "Quality engineering review focused on test strategy and product risk.",
    sections: [
      "Test Design",
      "Automation",
      "Exploratory Testing",
      "Risk Analysis",
      "Communication",
      "Product Knowledge"
    ]
  },
  {
    name: "Engineering",
    description: "Engineering review across code, architecture, delivery, and collaboration.",
    sections: ["Code Quality", "Architecture", "Delivery", "Collaboration", "Innovation"]
  }
];

type TemplateWithSections = Prisma.FeedbackTemplateGetPayload<{
  include: { sections: { include: { questions: true } } };
}>;

function buildTemplateSnapshot(template: TemplateWithSections) {
  return {
    id: template.id,
    name: template.name,
    version: template.version,
    sections: template.sections.map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order,
      questions: section.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        required: question.required,
        options: question.options,
        order: question.order,
        weight: question.weight.toString()
      }))
    }))
  };
}

async function upsertRole(
  key: keyof typeof ROLE_PERMISSION_KEYS,
  name: string,
  description: string
) {
  const role = await prisma.role.upsert({
    where: { key },
    update: { name, description },
    create: { key, name, description }
  });

  for (const permissionKey of ROLE_PERMISSION_KEYS[key]) {
    const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id }
    });
  }

  return role;
}

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { name: permission.name, description: permission.description },
      create: permission
    });
  }

  const employeeRole = await upsertRole(
    "employee",
    "Employee",
    "Can request, give, and view own feedback."
  );
  const managerRole = await upsertRole(
    "manager",
    "Manager",
    "Can manage team review workflows and analytics."
  );
  const hrRole = await upsertRole(
    "hr",
    "HR",
    "Can configure templates, cycles, permissions, and reports."
  );
  const adminRole = await upsertRole(
    "admin",
    "Admin",
    "Can manage system configuration and master data."
  );

  const products = await Promise.all(
    ["Platform Core", "Customer Portal", "Data Intelligence"].map((name) =>
      prisma.product.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name} product line` }
      })
    )
  );

  const teams = await Promise.all(
    [
      { name: "Platform Engineering", productId: products[0].id },
      { name: "Quality Guild", productId: products[1].id },
      { name: "People Operations", productId: products[2].id }
    ].map((team) =>
      prisma.team.upsert({
        where: { name: team.name },
        update: team,
        create: { ...team, description: `${team.name} team` }
      })
    )
  );

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const users = await Promise.all(
    [
      {
        email: "nykonenko_sv@groupbwt.com",
        legacyEmail: "employee@example.com",
        name: "Elena Employee",
        title: "Software Engineer",
        teamId: teams[0].id,
        role: employeeRole
      },
      {
        email: "nykonenko_sv+manager@groupbwt.com",
        legacyEmail: "manager@example.com",
        name: "Maks Manager",
        title: "Engineering Manager",
        teamId: teams[0].id,
        role: managerRole
      },
      {
        email: "nykonenko_sv+hr@groupbwt.com",
        legacyEmail: "hr@example.com",
        name: "Hanna HR",
        title: "HR Business Partner",
        teamId: teams[2].id,
        role: hrRole
      },
      {
        email: "nykonenko_sv+admin@groupbwt.com",
        legacyEmail: "admin@example.com",
        name: "Ada Admin",
        title: "Systems Administrator",
        teamId: teams[2].id,
        role: adminRole
      },
      {
        email: "nykonenko_sv+qa@groupbwt.com",
        legacyEmail: "qa@example.com",
        name: "Quinn QA",
        title: "QA Engineer",
        teamId: teams[1].id,
        role: employeeRole
      }
    ].map(async (user) => {
      const existing =
        (await prisma.user.findUnique({ where: { email: user.email } })) ??
        (await prisma.user.findUnique({ where: { email: user.legacyEmail } }));
      const created = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              email: user.email,
              name: user.name,
              title: user.title,
              teamId: user.teamId,
              passwordHash
            }
          })
        : await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              title: user.title,
              teamId: user.teamId,
              passwordHash
            }
          });
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: created.id, roleId: user.role.id } },
        update: {},
        create: { userId: created.id, roleId: user.role.id }
      });
      return created;
    })
  );

  await prisma.user.update({ where: { id: users[0].id }, data: { managerId: users[1].id } });
  await prisma.user.update({ where: { id: users[4].id }, data: { managerId: users[1].id } });

  for (const definition of templateDefinitions) {
    await prisma.feedbackTemplate.upsert({
      where: { name_version: { name: definition.name, version: 1 } },
      update: {},
      create: {
        name: definition.name,
        description: definition.description,
        builtIn: true,
        active: true,
        sections: {
          create: definition.sections.map((title, sectionIndex) => ({
            title,
            order: sectionIndex + 1,
            questions: {
              create: [
                {
                  prompt: `Rate ${title.toLowerCase()}`,
                  type: QuestionType.RATING_1_5,
                  order: 1,
                  required: true
                },
                {
                  prompt: `What evidence supports this ${title.toLowerCase()} rating?`,
                  type: QuestionType.LONG_TEXT,
                  order: 2,
                  required: true
                },
                {
                  prompt: `Select strengths for ${title.toLowerCase()}`,
                  type: QuestionType.MULTI_SELECT,
                  order: 3,
                  required: false,
                  options: ["Consistency", "Mentoring", "Execution", "Ownership", "Clarity"]
                }
              ]
            }
          }))
        }
      }
    });
  }

  const engineeringTemplate = await prisma.feedbackTemplate.findFirstOrThrow({
    where: { name: "Engineering" },
    include: { sections: { include: { questions: true }, orderBy: { order: "asc" } } }
  });

  const cycle = await prisma.reviewCycle.upsert({
    where: { id: "seed-cycle-2026-h1" },
    update: {},
    create: {
      id: "seed-cycle-2026-h1",
      name: "H1 2026 Engineering Performance Review",
      description: "Seed review cycle for local development and E2E tests.",
      type: CycleType.PERFORMANCE,
      status: CycleStatus.ACTIVE,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-06-30T23:59:59.000Z"),
      templateId: engineeringTemplate.id,
      productId: products[0].id,
      teamId: teams[0].id,
      createdById: users[2].id,
      workflowConfig: defaultWorkflowConfig
    }
  });

  const feedback = await prisma.feedback.upsert({
    where: { id: "seed-feedback-employee" },
    update: {},
    create: {
      id: "seed-feedback-employee",
      cycleId: cycle.id,
      requesterId: users[1].id,
      subjectId: users[0].id,
      authorId: users[4].id,
      status: FeedbackStatus.DRAFT,
      progress: 34,
      templateSnapshot: buildTemplateSnapshot(engineeringTemplate),
      lastAutosavedAt: new Date()
    }
  });

  const firstQuestion = engineeringTemplate.sections[0]?.questions[0];
  if (firstQuestion) {
    await prisma.answer.upsert({
      where: { feedbackId_questionId: { feedbackId: feedback.id, questionId: firstQuestion.id } },
      update: { value: 4 },
      create: {
        feedbackId: feedback.id,
        questionId: firstQuestion.id,
        authorId: users[4].id,
        value: 4
      }
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        id: "seed-notification-feedback-requested",
        userId: users[0].id,
        type: "feedback_requested",
        title: "Feedback requested",
        body: "Maks requested peer feedback for the H1 review cycle.",
        href: "/reviews"
      },
      {
        id: "seed-notification-cycle-started",
        userId: users[1].id,
        type: "cycle_started",
        title: "Review cycle started",
        body: "H1 2026 Engineering Performance Review is active.",
        href: "/reviews"
      }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
