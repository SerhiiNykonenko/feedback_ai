import "server-only";

export function isDatabaseUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "";
  return code === "P1001" || message.includes("Can't reach database server");
}
