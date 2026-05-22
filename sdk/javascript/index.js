/**
 * SplitSMS JavaScript SDK (starter)
 * @example
 * const client = new SplitSMSClient({ apiKey: 'sk_live_...', baseUrl: 'https://app.example.com' });
 * await client.sendSms({ sender: 'SplitSMS', recipients: ['+233201234567'], message: 'Hello' });
 */
export class SplitSMSClient {
  /**
   * @param {{ apiKey: string; baseUrl?: string; maxRetries?: number }} options
   */
  constructor(options) {
    if (!options?.apiKey) throw new Error("apiKey is required");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "http://localhost:3000").replace(/\/$/, "");
    this.maxRetries = options.maxRetries ?? 2;
  }

  async request(method, path, body) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(data?.error?.message ?? res.statusText);
          err.code = data?.error?.code;
          err.status = res.status;
          throw err;
        }
        return data;
      } catch (e) {
        lastError = e;
        if (attempt === this.maxRetries || (e.status && e.status < 500)) throw e;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  sendSms({ sender, recipients, message, countryCode = "GH" }) {
    return this.request("POST", "/api/v1/messages/send", {
      sender,
      recipients,
      message,
      countryCode,
    });
  }

  getBalance() {
    return this.request("GET", "/api/v1/wallet/balance");
  }

  getMessage(id) {
    return this.request("GET", `/api/v1/messages/${id}`);
  }

  listCampaigns(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request("GET", `/api/v1/campaigns${q ? `?${q}` : ""}`);
  }

  sendOtp(phone, countryCode) {
    return this.request("POST", "/api/v1/otp/send", { phone, countryCode });
  }

  verifyOtp(phone, code) {
    return this.request("POST", "/api/v1/otp/verify", { phone, code });
  }
}
