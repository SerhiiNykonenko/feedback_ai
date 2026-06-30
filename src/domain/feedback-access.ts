const REVIEW_PERMISSIONS = [
  "feedback.review.team",
  "feedback.approve",
  "feedback.publish"
] as const;

export type FeedbackAccessRecord = {
  status: string;
  authorId: string;
  requesterId: string;
  subjectId: string;
  subjectTeamId: string | null;
};

export type FeedbackAccessActor = {
  userId: string;
  teamId: string | null | undefined;
  permissions: readonly string[];
};

export function canViewFeedbackDetails(
  feedback: FeedbackAccessRecord,
  actor: FeedbackAccessActor
) {
  if (feedback.authorId === actor.userId) return true;
  if (feedback.status === "DRAFT") return false;

  if (
    feedback.status === "PUBLISHED" &&
    (feedback.subjectId === actor.userId || feedback.requesterId === actor.userId)
  ) {
    return true;
  }

  const canModerate = REVIEW_PERMISSIONS.some((permission) =>
    actor.permissions.includes(permission)
  );
  if (!canModerate) return false;

  if (actor.permissions.includes("cycles.manage.org")) return true;

  return Boolean(actor.teamId && feedback.subjectTeamId === actor.teamId);
}
