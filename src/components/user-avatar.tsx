import Image from "next/image";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  image,
  className
}: {
  name?: string | null;
  image?: string | null;
  className?: string;
}) {
  const initials = (name ?? "User")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-brand-purple text-xs font-semibold text-white shadow-sm ring-1 ring-border",
        className
      )}
      aria-label={name ? `${name} avatar` : "User avatar"}
    >
      {image ? (
        <Image src={image} alt="" fill sizes="80px" className="object-cover" unoptimized />
      ) : (
        initials
      )}
    </div>
  );
}
