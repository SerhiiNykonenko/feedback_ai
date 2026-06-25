"use client";

import { ErrorState } from "@/components/ui/state-view";

export default function AppError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Something went wrong"
      description="The page could not be loaded. Retry the request or contact an administrator if this keeps happening."
      onRetry={reset}
    />
  );
}
