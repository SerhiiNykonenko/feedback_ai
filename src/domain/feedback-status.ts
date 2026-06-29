import type { FeedbackStatus } from "./workflows";

export type FeedbackStatusMeta = {
  label: string;
  description: string;
  tone: string;
};

const statusMeta: Record<FeedbackStatus, FeedbackStatusMeta> = {
  DRAFT: {
    label: "Needs response",
    description: "The author can still edit and submit this feedback.",
    tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
  },
  SUBMITTED: {
    label: "Ready for review",
    description: "Feedback was sent and is waiting for a manager review.",
    tone: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
  },
  UNDER_REVIEW: {
    label: "Manager review",
    description: "A manager is checking this feedback before approval.",
    tone: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
  },
  APPROVED: {
    label: "Approved",
    description: "Feedback is approved and ready to be shared.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
  },
  PUBLISHED: {
    label: "Shared",
    description: "Feedback has been published to the intended audience.",
    tone: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200"
  }
};

export function getFeedbackStatusMeta(status: FeedbackStatus | string): FeedbackStatusMeta {
  return statusMeta[status as FeedbackStatus] ?? statusMeta.DRAFT;
}

export function getFeedbackPrimaryAction(status: FeedbackStatus | string) {
  switch (status) {
    case "DRAFT":
      return "Continue";
    case "SUBMITTED":
      return "Review";
    case "UNDER_REVIEW":
      return "Approve";
    case "APPROVED":
      return "Publish";
    default:
      return "View";
  }
}
