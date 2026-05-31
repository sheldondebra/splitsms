import { HttpClient } from "./utils/http.js";
import { MessagesResource } from "./messages/index.js";
import { OtpResource } from "./otp/index.js";
import { WalletResource } from "./wallet/index.js";
import { CampaignsResource } from "./campaigns/index.js";
import { ConnectResource } from "./connect/index.js";
import { SenderIdsResource } from "./sender-ids/index.js";
/**
 * Official SplitSMS SDK — SMS, OTP, wallet, campaigns, Connect, and sender IDs.
 * @see https://www.splitsms.com/sdk
 */
export class SplitSMS {
    constructor(options) {
        this.http = new HttpClient(options);
        this.messages = new MessagesResource(this.http);
        this.otp = new OtpResource(this.http);
        this.wallet = new WalletResource(this.http);
        this.campaigns = new CampaignsResource(this.http);
        this.connect = new ConnectResource(this.http);
        this.senderIds = new SenderIdsResource(this.http);
    }
    /** @deprecated Use messages.send() */
    sendSms(input) {
        return this.messages.send(input);
    }
    getBalance() {
        return this.wallet.accountBalance();
    }
}
/** @deprecated Use SplitSMS */
export const SplitSMSClient = SplitSMS;
