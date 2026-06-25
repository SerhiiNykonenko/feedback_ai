import "server-only";
import { ROLE_PERMISSION_KEYS, type RoleKey } from "@/domain/permissions";

export const demoPassword = "Password123!";

export const demoUsers = [
  {
    id: "demo-employee",
    email: "employee@example.com",
    name: "Elena Employee",
    title: "Software Engineer",
    teamId: "demo-platform-team",
    teamName: "Platform Engineering",
    managerName: "Maks Manager",
    roles: ["employee"] satisfies RoleKey[]
  },
  {
    id: "demo-manager",
    email: "manager@example.com",
    name: "Maks Manager",
    title: "Engineering Manager",
    teamId: "demo-platform-team",
    teamName: "Platform Engineering",
    roles: ["manager"] satisfies RoleKey[]
  },
  {
    id: "demo-hr",
    email: "hr@example.com",
    name: "Hanna HR",
    title: "HR Business Partner",
    teamId: "demo-people-team",
    teamName: "People Operations",
    roles: ["hr"] satisfies RoleKey[]
  },
  {
    id: "demo-admin",
    email: "admin@example.com",
    name: "Ada Admin",
    title: "Systems Administrator",
    teamId: "demo-people-team",
    teamName: "People Operations",
    roles: ["admin"] satisfies RoleKey[]
  },
  {
    id: "demo-qa",
    email: "qa@example.com",
    name: "Quinn QA",
    title: "QA Engineer",
    teamId: "demo-quality-team",
    teamName: "Quality Guild",
    managerName: "Maks Manager",
    roles: ["employee"] satisfies RoleKey[]
  }
];

export function getDemoUserByEmail(email: string) {
  return demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function getDemoPermissions(roles: RoleKey[]) {
  return Array.from(new Set(roles.flatMap((role) => ROLE_PERMISSION_KEYS[role])));
}

export const demoNotifications = [
  {
    id: "demo-notification-feedback",
    title: "Feedback requested",
    body: "Maks requested peer feedback for the H1 review cycle.",
    status: "UNREAD",
    type: "feedback_requested",
    href: "/reviews",
    createdAt: new Date("2026-06-20T09:00:00.000Z")
  },
  {
    id: "demo-notification-cycle",
    title: "Review cycle started",
    body: "H1 2026 Engineering Performance Review is active.",
    status: "UNREAD",
    type: "cycle_started",
    href: "/reviews",
    createdAt: new Date("2026-06-18T09:00:00.000Z")
  }
];

export const demoTemplates = [
  {
    id: "demo-template-engineering",
    name: "Engineering",
    description: "Engineering review across code, architecture, delivery, and collaboration.",
    builtIn: true,
    version: 1,
    active: true,
    sections: ["Code Quality", "Architecture", "Delivery", "Collaboration", "Innovation"].map(
      (title, index) => ({
        id: `demo-engineering-section-${index + 1}`,
        title,
        description: null,
        order: index + 1,
        questions: [
          {
            id: `demo-engineering-question-${index + 1}-rating`,
            prompt: `Rate ${title.toLowerCase()}`,
            type: "RATING_1_5",
            required: true,
            order: 1,
            options: null
          },
          {
            id: `demo-engineering-question-${index + 1}-evidence`,
            prompt: `What evidence supports this ${title.toLowerCase()} rating?`,
            type: "LONG_TEXT",
            required: true,
            order: 2,
            options: null
          }
        ]
      })
    ),
    _count: { cycles: 1 }
  },
  {
    id: "demo-template-general",
    name: "General Performance",
    description: "Broad performance review across communication, ownership, and execution.",
    builtIn: true,
    version: 1,
    active: true,
    sections: [
      "Communication",
      "Technical Skills",
      "Ownership",
      "Teamwork",
      "Leadership",
      "Problem Solving"
    ].map((title, index) => ({
      id: `demo-general-section-${index + 1}`,
      title,
      description: null,
      order: index + 1,
      questions: []
    })),
    _count: { cycles: 0 }
  }
];

export const demoCycles = [
  {
    id: "demo-cycle-h1",
    name: "H1 2026 Engineering Performance Review",
    description: "Demo review cycle for local development.",
    type: "PERFORMANCE",
    status: "ACTIVE",
    startsAt: new Date("2026-01-01T00:00:00.000Z"),
    endsAt: new Date("2026-06-30T23:59:59.000Z"),
    template: { id: "demo-template-engineering", name: "Engineering" },
    product: { id: "demo-product-platform", name: "Platform Core" },
    team: { id: "demo-platform-team", name: "Platform Engineering" },
    _count: { feedback: 8 }
  },
  {
    id: "demo-cycle-peer",
    name: "Continuous Peer Feedback",
    description: "Always-on peer feedback for cross-team collaboration.",
    type: "CONTINUOUS",
    status: "ACTIVE",
    startsAt: null,
    endsAt: null,
    template: { id: "demo-template-general", name: "General Performance" },
    product: null,
    team: null,
    _count: { feedback: 14 }
  }
];
