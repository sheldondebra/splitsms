import type { HttpClient } from "../utils/http.js";

export type SendMessageInput = {
  sender?: string;
  from?: string;
  message: string;
  to?: string;
  recipients?: string[];
  countryCode?: string;
};

export class MessagesResource {
  constructor(private readonly http: HttpClient) {}

  /** Send one or more SMS messages */
  send(input: SendMessageInput) {
    return this.http.request<Record<string, unknown>>("POST", "/api/v1/sms/send", input);
  }

  /** Get delivery status for a message */
  get(id: string) {
    return this.http.request<Record<string, unknown>>("GET", `/api/v1/messages/${id}`);
  }

  /** List delivery reports */
  reports(params: Record<string, string | number | undefined> = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) q.set(k, String(v));
    }
    const query = q.toString();
    return this.http.request<Record<string, unknown>>(
      "GET",
      `/api/v1/reports${query ? `?${query}` : ""}`,
    );
  }
}
