import { notFound } from "next/navigation";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { getFeedbackFormData } from "@/features/feedback/data";
import { requirePermission } from "@/server/auth/guards";

export default async function FeedbackPage({
  params
}: {
  params: Promise<{ feedbackId: string }>;
}) {
  const user = await requirePermission("feedback.write");
  const { feedbackId } = await params;
  try {
    const feedback = await getFeedbackFormData(feedbackId, user.id);
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">{feedback.cycleName}</h1>
          <p className="text-sm text-muted-foreground">Feedback for {feedback.subjectName}</p>
        </div>
        <FeedbackForm
          feedbackId={feedback.id}
          sections={feedback.sections}
          initialAnswers={feedback.initialAnswers}
          readOnly={feedback.status !== "DRAFT"}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
