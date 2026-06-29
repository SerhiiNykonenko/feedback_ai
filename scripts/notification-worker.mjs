const endpoint =
  process.env.NOTIFICATION_WORKER_URL ??
  "http://app:3000/api/internal/notifications/process";
const secret = process.env.NOTIFICATION_WORKER_SECRET;
const intervalMs = Number(process.env.NOTIFICATION_WORKER_INTERVAL_MS ?? 10_000);

if (!secret) {
  throw new Error("NOTIFICATION_WORKER_SECRET is required");
}

let stopping = false;

async function run() {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) {
      throw new Error(`Worker endpoint returned ${response.status}`);
    }
    const result = await response.json();
    if (result.claimed > 0) console.info(JSON.stringify({ event: "notification_batch", ...result }));
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "notification_worker_error",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    );
  }

  if (!stopping) setTimeout(run, intervalMs);
}

process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});

await run();
