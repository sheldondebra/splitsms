# mNotify maintenance: November 14–15, 2026

Reviewed against `master` commit `08e11c8efb13dd7f4895ef3fd45dfae137b01e96` on October 24, 2026. This is a code audit and a proposed safeguard patch, not a production clearance.

## Impact assessment

Customer campaigns **could be affected** if their effective route or account lock selects mNotify, including campaigns started before maintenance whose queue continues into it. Neither the repository nor the maintenance email establishes current production use. Other providers can remain available, but failover is not proof of protection: fallback credentials, funding, country coverage and sender approvals must work independently.

The maintenance notice supplied for this review says Saturday November 14, 11 PM through Sunday November 15, 1 AM; it specifies **no maintenance time zone**. Its UTC email header describes transmission time, not the maintenance zone. The matching mNotify inbox search and official-site searches did not locate a timezone clarification. Ghana/GMT is a plausible inference, **not verified**.

If mNotify confirms Africa/Accra (UTC+00:00), the window would be:

| Zone | Start | End |
| --- | --- | --- |
| Ghana / UTC | Nov 14, 23:00 | Nov 15, 01:00 |
| Maryland / America/New_York | Nov 14, 18:00 EST | Nov 14, 20:00 EST |

Do not activate those instants until confirmed. The provider says it will email when service returns; extend the hold if recovery is delayed.

## Confirmed code findings

| Area | Before this patch | Safeguard proposed |
| --- | --- | --- |
| Provider selection | Database country routes, GLOBAL fallback, static defaults; member assignment and enterprise locks bypass normal selection. Global mNotify-first applies when recipient auto-routing is off. | Keep selection and locks; honor `allowFailover` in every routed sequence and attempt each provider once. |
| Uncertain submission | mNotify timeout became ordinary failure; subsequent failover or stale worker reset could send again. | Mark unknown acceptance `PROCESSING`, retain reserved credits and quarantine for reconciliation; never infer failure from a timeout. |
| Maintenance | No maintenance gate in the mNotify send function. | Explicit-offset environment window checked before network submission, including direct calls; routed jobs stay PENDING with their original reserved credits. |
| Slow delivery | Watcher and cron forcibly resent after ten seconds without DLR, discarding the original reference. | Remove automatic resend; preserve accepted sends and references. Normal delivery-report workers continue polling. |
| Delivery reports | Substring `DELIVER` matched `UNDELIVERED`; webhook and poller differed. Terminal status could regress on reordered reports. | Shared negative-first mapper, provider-scoped mNotify lookup, compare-and-set updates and immutable terminal states. Conflicting terminal reports need review. |
| Campaign scheduling | Overlapping schedulers could both debit and create a batch; SENDING campaigns could be redispatched. | Claim SCHEDULED → SENDING before debit and message creation. Immediate campaigns enter through the same claim. Interrupted dispatch requires review. |
| Refunds | Multiple callbacks/pollers could refund the same attempt; credit and refund status were not tied to a durable receipt. | Per-message row lock and `refundProcessed` receipt committed with the credit adjustment and REFUND ledger entry. Paid admin retry resets the receipt and old provider reference. Legacy FAILED callbacks without a new pending-refund marker do not create new refunds. |

Key source files: `lib/mnotify.ts`, `lib/sms/orchestrator.ts`, `lib/sms/country-provider.ts`, `lib/queue/process-message.ts`, `lib/sms/force-resend-slow-delivery.ts`, `lib/sms/sync-mnotify-dlr.ts`, `lib/sms/message-billing.ts`, `lib/campaigns/dispatch.ts`.

## Deployment and production verification

The live `https://www.splitsms.com/admin` entry redirected to sign-in. No production configuration, campaign records, logs, provider credentials or balances were read or changed. No test SMS, support email, customer notification or production deployment was performed.

1. Obtain an explicit zone confirmation from mNotify. Suggested reply to the notice: “Please confirm the time zone for the November 14, 2026, 11:00 PM–November 15, 1:00 AM maintenance window. Is it Africa/Accra (GMT/UTC+00:00)? Does it affect API submissions, previously queued SMS, and delivery reports? Please also confirm how we should verify recovery before resuming campaigns.” This reply has not been sent.
2. Back up the database and stage the additive SQL in `scripts/sql/20261024-sms-refund-guard.sql` **before** deploying code. The new receipt is required by the generated Prisma client and refund transaction. Regenerate Prisma (`npx prisma generate`). No migration has been applied here. Older code ignores the added column, but rolling back restores the original unsafe retry behavior.
3. Deploy web, SMS workers and report workers together. Verify the database column, shared application revision and cron/worker health. The repository uses `db:push` rather than an established migration directory; the SQL file is an explicit alternative for this one additive change, not a new migration framework.
4. In the production runtime, run `npx tsx scripts/audit-mnotify-maintenance.ts '<confirmed start with offset>' '<confirmed end with offset>'`. It performs SELECTs and reports sanitized routing settings, effective provider orders, account lock summaries, candidate scheduled/overdue campaigns and queue counts. It does not output keys, SMS content or recipient numbers. Treat candidate campaigns as an upper bound until recipient-country routing and user locks are checked. Future recurring runs and traffic arriving after the audit are not covered.
5. Review `sms_routing_policy`, `mnotify_config`, active route steps, GLOBAL/static fallbacks, assigned providers and dedicated enterprise locks. `country-provider.ts` currently does not filter `SmsRoute.isActive`, and static fallback can list a disabled provider; those pre-existing behaviors need operator review. Do not rely solely on an admin route toggle. Check fallback country coverage, credentials, balances and each customer's sender approval before authorizing an alternative route.
6. Configure `MNOTIFY_MAINTENANCE_START` and `MNOTIFY_MAINTENANCE_END` with confirmed ISO timestamps containing `Z` or explicit offsets on **every** submitting runtime. Both unset means no hold. Missing/invalid/reversed configuration holds mNotify until corrected. No timezone or dates are hard-coded into the application. During a hold, other routes operate normally until they select mNotify; the hold stops that sequence rather than silently switching a locked/unverified sender to another provider.
7. Run staging tests with mocked providers, then separately validate actual PostgreSQL concurrency/rollback, callback payloads, and worker recovery. A real provider send should use an approved test recipient and approved spend; none was made in this audit. Campaigns queued during the hold retain their initial prepaid credit deduction and resume through the normal cron/worker drain after the end instant. Run the cron if needed and verify it is healthy; there is no independent resume service.
8. Before, during and after maintenance, inspect queued/PROCESSING counts, per-provider logs, DLR backlog and refund ledger. Quarantined unknown submissions must be checked with mNotify before any retry or refund. Do not bulk reset them. Resume production campaigns only after recovery and correct routing are established.

## Remaining limitations and review gates

- No live routing, affected campaign count, fallback delivery guarantee or maintenance time zone is confirmed. A lack of repository evidence is not evidence that no campaigns are scheduled.
- Database/provider boundaries cannot provide exactly-once delivery without provider idempotency or authoritative lookup. Quarantine favors avoiding duplicates; an interrupted worker can therefore hold an unsent SMS until an operator reconciles it. Campaign dispatch has an equivalent manual recovery case after claim but before all debit/message operations commit.
- Existing admin retry actions debit before updating the message; concurrent admin retry requests still need a separate atomic debit/claim design. Suspend manual bulk retries during incident reconciliation. Historical unknown refunds cannot be reconstructed automatically. The receipt is for the current billed lifecycle, and changing pricing or enterprise-account configuration between debit and refund still requires checking the original ledger; an immutable billing-instrument/credit snapshot is not added here.
- Commission reversal follows the credit refund and can require reconciliation if interrupted. The patch logs a failed reversal; it does not duplicate the wallet refund.
- The existing mNotify webhook has no authentication/signature verification. Validate provider-supported verification and the real callback format before treating it as an authoritative basis for refunds. The existing periodic-report fallback uses fuzzy content matching when IDs are missing; manually review those historical repairs. This patch does not certify that matching.
- Poll-only FAILED refunds interrupted after status commit need a replayed authoritative report or operator reconciliation; recurring poll selection ordinarily covers SENT/PENDING. Conflicting terminal reports are preserved for manual review rather than silently changing a refunded or delivered message.
- Delayed delivery is represented as SENT, not DELIVERED. Campaign COMPLETED means its send queue drained, not that every recipient received the SMS.

## Validation

`npm run test:sms-safety`: 31 passing tests, covering window boundaries, explicit offsets, invalid configuration, no maintenance network request, timeout/5xx/malformed responses, failover controls/deduplication, delayed-DLR no-resend, concurrent status updates, historical failures, refund replay/rollback and paid retries, enterprise refunds, and competing schedulers.

Existing queue, SMS and Sender ID tests: 28 passing. Provider and database behavior in the new tests uses mocks; actual production/PostgreSQL/provider integration remains unverified.

Full TypeScript check reports an existing fixture error in `tests/reports/account-report-templates.test.ts:32` (missing `avgUnitsPerMessage`, `allTimeMessages`, `lastMessageAt`). The same error was reproduced on unchanged `master` at the audited commit. No production build or deployment was attempted.
