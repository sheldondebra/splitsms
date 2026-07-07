/** Parallel inline sends per serverless invocation (Vercel default path). */
export const SMS_INLINE_CONCURRENCY = 12;

/** Cron / admin batch drain parallelism. */
export const SMS_BATCH_CONCURRENCY = 10;

/** Default messages processed per cron tick. */
export const SMS_CRON_BATCH_LIMIT = 40;
