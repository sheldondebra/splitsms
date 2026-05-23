import type { HttpClient } from "../utils/http.js";

export class WalletResource {
  constructor(private readonly http: HttpClient) {}

  balance() {
    return this.http.request<Record<string, unknown>>("GET", "/api/v1/wallet/balance");
  }

  /** Alias for account-level balance */
  accountBalance() {
    return this.http.request<Record<string, unknown>>("GET", "/api/v1/balance");
  }

  transactions(params: Record<string, string | number | undefined> = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) q.set(k, String(v));
    }
    const query = q.toString();
    return this.http.request<Record<string, unknown>>(
      "GET",
      `/api/v1/wallet/transactions${query ? `?${query}` : ""}`,
    );
  }
}
