/**
 * Repo-local re-export (run `npm run build` in sdk/javascript for TypeScript dist).
 * Install: npm install https://www.splitsms.com/sdk/javascript/splitsms-sdk.tgz
 * (NOT npm install @splitsms/sdk — not on registry.npmjs.org)
 */
export { SplitSMS, SplitSMSClient, SplitSMSError } from "./dist/index.js";
