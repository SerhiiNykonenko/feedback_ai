import { describe, expect, it } from "vitest";
import { canViewFeedbackDetails } from "@/domain/feedback-access";

const feedback = {
  status: "UNDER_REVIEW",
  authorId: "author",
  requesterId: "requester",
  subjectId: "subject",
  subjectTeamId: "team-a"
};

describe("feedback detail access", () => {
  it("allows the author to open their feedback in every status", () => {
    expect(
      canViewFeedbackDetails(
        { ...feedback, status: "DRAFT" },
        { userId: "author", teamId: "team-b", permissions: [] }
      )
    ).toBe(true);
  });

  it("keeps drafts private from reviewers and organization administrators", () => {
    expect(
      canViewFeedbackDetails(
        { ...feedback, status: "DRAFT" },
        {
          userId: "hr",
          teamId: null,
          permissions: ["feedback.approve", "cycles.manage.org"]
        }
      )
    ).toBe(false);
  });

  it("allows team reviewers to inspect feedback for their team", () => {
    expect(
      canViewFeedbackDetails(feedback, {
        userId: "manager",
        teamId: "team-a",
        permissions: ["feedback.review.team"]
      })
    ).toBe(true);
  });

  it("denies team reviewers access to another team", () => {
    expect(
      canViewFeedbackDetails(feedback, {
        userId: "manager",
        teamId: "team-b",
        permissions: ["feedback.approve"]
      })
    ).toBe(false);
  });

  it("allows HR and Admin organization reviewers to inspect non-draft feedback", () => {
    expect(
      canViewFeedbackDetails(feedback, {
        userId: "hr",
        teamId: null,
        permissions: ["feedback.publish", "cycles.manage.org"]
      })
    ).toBe(true);
  });

  it("does not expose unpublished feedback to its subject or requester", () => {
    expect(
      canViewFeedbackDetails(feedback, {
        userId: "subject",
        teamId: "team-a",
        permissions: ["feedback.read.own"]
      })
    ).toBe(false);
    expect(
      canViewFeedbackDetails(feedback, {
        userId: "requester",
        teamId: "team-a",
        permissions: ["feedback.read.own"]
      })
    ).toBe(false);
  });

  it.each(["subject", "requester"])("allows published feedback access to %s", (userId) => {
    expect(
      canViewFeedbackDetails(
        { ...feedback, status: "PUBLISHED" },
        { userId, teamId: null, permissions: ["feedback.read.own"] }
      )
    ).toBe(true);
  });

  it("denies unrelated employees access to published feedback", () => {
    expect(
      canViewFeedbackDetails(
        { ...feedback, status: "PUBLISHED" },
        { userId: "employee", teamId: null, permissions: ["feedback.read.own"] }
      )
    ).toBe(false);
  });
});
