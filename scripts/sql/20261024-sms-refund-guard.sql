-- Apply before deploying the SMS maintenance safeguards, after a backup.
-- Existing FAILED messages are not automatically refunded by the new DLR path.
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "refundProcessed" BOOLEAN NOT NULL DEFAULT false;
