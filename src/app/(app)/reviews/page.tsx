import { getReviewsData } from "@/features/review-cycles/data";
import { ReviewsView } from "@/features/review-cycles/reviews-view";
import { requirePermission } from "@/server/auth/guards";

export default async function ReviewsPage() {
  const user = await requirePermission("feedback.read.own");
  const data = await getReviewsData(user.id, user.teamId, user.permissions);
  return (
    <ReviewsView
      data={data}
      permissions={user.permissions}
      currentUserId={user.id}
      currentTeamId={user.teamId}
    />
  );
}
