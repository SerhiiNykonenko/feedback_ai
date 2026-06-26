"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function AvatarUpload({
  name,
  image
}: {
  name: string;
  image?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(image);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.set("avatar", file);
    try {
      const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const result = (await response.json()) as { image?: string; error?: string };
      if (!response.ok || !result.image) throw new Error(result.error ?? "Upload failed");
      URL.revokeObjectURL(localPreview);
      setPreview(result.image);
      setStatus("idle");
      router.refresh();
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreview(image);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <div className="group relative">
        <UserAvatar name={name} image={preview} className="h-24 w-24 text-xl" />
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-brand-purple/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload avatar"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.currentTarget.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
      >
        {status === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {status === "uploading" ? "Uploading..." : "Change photo"}
      </Button>
      <p className="max-w-52 text-xs text-muted-foreground">
        JPG, PNG or WebP. Maximum 2 MB.
      </p>
      {status === "error" ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
