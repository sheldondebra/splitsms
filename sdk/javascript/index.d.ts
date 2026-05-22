export type SplitSMSOptions = {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
};

export type SendSmsParams = {
  sender: string;
  recipients: string[];
  message: string;
  countryCode?: string;
};

export class SplitSMSClient {
  constructor(options: SplitSMSOptions);
  request<T = unknown>(method: string, path: string, body?: object): Promise<T>;
  sendSms(params: SendSmsParams): Promise<{
    success: boolean;
    campaign_id: string;
    message_ids: string[];
    queued: boolean;
    sandbox: boolean;
  }>;
  getBalance(): Promise<{ success: boolean; wallet: { balance: number; currency: string }; sms_credits: number }>;
  getMessage(id: string): Promise<{ success: boolean; data: Record<string, unknown> }>;
  listCampaigns(params?: Record<string, string>): Promise<{ success: boolean; data: unknown[] }>;
  sendOtp(phone: string, countryCode?: string): Promise<{ success: boolean; ok: boolean }>;
  verifyOtp(phone: string, code: string): Promise<{ success: boolean; verified: boolean }>;
}
