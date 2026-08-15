/** Parallel inline sends per serverless invocation (Vercel / Cloud Run default path). */
export const SMS_INLINE_CONCURRENCY = 20;

/** Cron / admin batch drain parallelism. */
export const SMS_BATCH_CONCURRENCY = 16;

/** Default messages processed per cron tick. */
export const SMS_CRON_BATCH_LIMIT = 60;

/**
 * Await provider send in the request when the batch is this size or smaller.
 * Larger campaigns stay deferred via `after()` so the API stays snappy.
 */
export const SMS_FAST_AWAIT_LIMIT = 25;
