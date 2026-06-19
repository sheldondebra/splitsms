export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { warmDatabaseConnection } = await import("@/lib/db");
  await warmDatabaseConnection().catch((err: Error) => {
    console.warn("[db] Startup warmup failed — Neon may wake on the first request:", err.message);
  });
}
