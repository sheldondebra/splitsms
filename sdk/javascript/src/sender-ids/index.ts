import type { HttpClient } from "../utils/http.js";

export type RegisterSenderIdInput = {
  value: string;
  country_code: string;
  purpose?: string;
  customer_id?: string;
  set_default?: boolean;
};

export class SenderIdsResource {
  constructor(private readonly http: HttpClient) {}

  list(customerId?: string) {
    const q = customerId ? `?customer_id=${encodeURIComponent(customerId)}` : "";
    return this.http.request<Record<string, unknown>>("GET", `/api/v1/sender-ids${q}`);
  }

  register(input: RegisterSenderIdInput) {
    return this.http.request<Record<string, unknown>>("POST", "/api/v1/sender-ids", input);
  }

  get(id: string) {
    return this.http.request<Record<string, unknown>>(
      "GET",
      `/api/v1/sender-ids/${encodeURIComponent(id)}`,
    );
  }
}
