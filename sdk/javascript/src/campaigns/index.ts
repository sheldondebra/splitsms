import type { HttpClient } from "../utils/http.js";

export class CampaignsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: Record<string, string | number | undefined> = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) q.set(k, String(v));
    }
    const query = q.toString();
    return this.http.request<Record<string, unknown>>(
      "GET",
      `/api/v1/campaigns${query ? `?${query}` : ""}`,
    );
  }

  get(id: string) {
    return this.http.request<Record<string, unknown>>("GET", `/api/v1/campaigns/${id}`);
  }

  messages(id: string, params: Record<string, string | number | undefined> = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) q.set(k, String(v));
    }
    const query = q.toString();
    return this.http.request<Record<string, unknown>>(
      "GET",
      `/api/v1/campaigns/${id}/messages${query ? `?${query}` : ""}`,
    );
  }
}
