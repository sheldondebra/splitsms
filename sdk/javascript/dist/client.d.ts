import { type HttpClientOptions } from "./utils/http.js";
import { MessagesResource } from "./messages/index.js";
import { OtpResource } from "./otp/index.js";
import { WalletResource } from "./wallet/index.js";
import { CampaignsResource } from "./campaigns/index.js";
import { ConnectResource } from "./connect/index.js";
import { SenderIdsResource } from "./sender-ids/index.js";
export type SplitSMSOptions = HttpClientOptions;
/**
 * Official SplitSMS SDK — SMS, OTP, wallet, campaigns, Connect, and sender IDs.
 * @see https://www.splitsms.com/sdk
 */
export declare class SplitSMS {
    private readonly http;
    readonly messages: MessagesResource;
    readonly otp: OtpResource;
    readonly wallet: WalletResource;
    readonly campaigns: CampaignsResource;
    readonly connect: ConnectResource;
    readonly senderIds: SenderIdsResource;
    constructor(options: SplitSMSOptions);
    /** @deprecated Use messages.send() */
    sendSms(input: Parameters<MessagesResource["send"]>[0]): Promise<Record<string, unknown>>;
    getBalance(): Promise<Record<string, unknown>>;
}
/** @deprecated Use SplitSMS */
export declare const SplitSMSClient: typeof SplitSMS;
//# sourceMappingURL=client.d.ts.map