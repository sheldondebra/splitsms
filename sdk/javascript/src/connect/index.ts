import type { HttpClient } from "../utils/http.js";

export type CreateConnectCustomerInput = {
  full_name: string;
  phone: string;
  country_code: string;
  email?: string;
  external_ref?: string;
  label?: string;
  initial_sms_credits?: number;
  initial_wallet_balance?: number;
  currency?: string;
};

export class ConnectResource {
  constructor(private readonly http: HttpClient) {}

  listCustomers(params: { limit?: number; external_ref?: string } = {}) {
    const q = new URLSearchParams();
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.external_ref) q.set("external_ref", params.external_ref);
    const query = q.toString();
    return this.http.request<Record<string, unknown>>(
      "GET",
      `/api/v1/connect/customers${query ? `?${query}` : ""}`,
    );
  }

  createCustomer(input: CreateConnectCustomerInput) {
    return this.http.request<Record<string, unknown>>("POST", "/api/v1/connect/customers", input);
  }

  getCustomer(id: string) {
    return this.http.request<Record<string, unknown>>(
      "GET",
      `/api/v1/connect/customers/${encodeURIComponent(id)}`,
    );
  }
}
