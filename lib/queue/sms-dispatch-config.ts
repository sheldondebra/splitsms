/** Parallel inline sends per serverless invocation (Vercel / Cloud Run default path). */
export const SMS_INLINE_CONCURRENCY = 24;

/** Cron / admin batch drain parallelism. */
export const SMS_BATCH_CONCURRENCY = 24;

/** Default messages processed per cron tick. */
export const SMS_CRON_BATCH_LIMIT = 80;

/**
 * Await provider send in the request when the batch is this size or smaller.
 * Larger campaigns stay deferred via `after()` so the API stays snappy.
 */
export const SMS_FAST_AWAIT_LIMIT = 50;

/** Pause between cron drain rounds. 0 = keep pulling while the queue has work. */
export const SMS_DRAIN_INTERVAL_MS = 0;

/** Max drain rounds per process-sms cron (minute budget ~52s). */
export const SMS_DRAIN_MAX_ROUNDS = 20;
