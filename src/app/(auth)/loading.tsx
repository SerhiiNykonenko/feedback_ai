import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Skeleton className="h-96 w-full max-w-md" />
    </main>
  );
}
