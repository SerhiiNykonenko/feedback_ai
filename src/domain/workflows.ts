export type CycleStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
export type FeedbackStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "PUBLISHED";

export type WorkflowStep = {
  status: FeedbackStatus;
  label: string;
  requiresApproval?: boolean;
};

export type WorkflowConfig = {
  steps: WorkflowStep[];
  allowManagerOverride: boolean;
  publishMode: "manual" | "auto_after_approval";
};

export const defaultWorkflowConfig: WorkflowConfig = {
  steps: [
    { status: "DRAFT", label: "Draft" },
    { status: "SUBMITTED", label: "Submitted" },
    { status: "UNDER_REVIEW", label: "Under Review", requiresApproval: true },
    { status: "APPROVED", label: "Approved" },
    { status: "PUBLISHED", label: "Published" }
  ],
  allowManagerOverride: false,
  publishMode: "manual"
};

const cycleTransitions: Record<CycleStatus, CycleStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: []
};

const feedbackTransitions: Record<FeedbackStatus, FeedbackStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED"],
  APPROVED: ["PUBLISHED"],
  PUBLISHED: []
};

export function canTransitionCycle(from: CycleStatus, to: CycleStatus) {
  return cycleTransitions[from].includes(to);
}

export function canTransitionFeedback(from: FeedbackStatus, to: FeedbackStatus) {
  return feedbackTransitions[from].includes(to);
}

export function validateWorkflowConfig(config: WorkflowConfig) {
  const statuses = config.steps.map((step) => step.status);
  const required: FeedbackStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "PUBLISHED"
  ];
  return required.every((status) => statuses.includes(status));
}
