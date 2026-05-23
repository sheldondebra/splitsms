import { HttpClient, type HttpClientOptions } from "./utils/http.js";
import { MessagesResource } from "./messages/index.js";
import { OtpResource } from "./otp/index.js";
import { WalletResource } from "./wallet/index.js";
import { CampaignsResource } from "./campaigns/index.js";

export type SplitSMSOptions = HttpClientOptions;

/**
 * Official SplitSMS SDK — SMS, OTP, wallet, and campaigns.
 * @see https://www.splitsms.com/sdk
 */
export class SplitSMS {
  private readonly http: HttpClient;

  readonly messages: MessagesResource;
  readonly otp: OtpResource;
  readonly wallet: WalletResource;
  readonly campaigns: CampaignsResource;

  constructor(options: SplitSMSOptions) {
    this.http = new HttpClient(options);
    this.messages = new MessagesResource(this.http);
    this.otp = new OtpResource(this.http);
    this.wallet = new WalletResource(this.http);
    this.campaigns = new CampaignsResource(this.http);
  }

  /** @deprecated Use messages.send() */
  sendSms(input: Parameters<MessagesResource["send"]>[0]) {
    return this.messages.send(input);
  }

  getBalance() {
    return this.wallet.accountBalance();
  }
}

/** @deprecated Use SplitSMS */
export const SplitSMSClient = SplitSMS;
