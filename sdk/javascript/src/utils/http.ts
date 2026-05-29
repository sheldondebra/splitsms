import { SplitSMSError, throwFromResponse } from "../errors.js";

export type HttpClientOptions = {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  fetch?: typeof fetch;
};

export class HttpClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: HttpClientOptions) {
    if (!options.apiKey) throw new SplitSMSError("apiKey is required");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://www.splitsms.com").replace(/\/$/, "");
    this.maxRetries = options.maxRetries ?? 2;
    this.fetchFn = options.fetch ?? globalThis.fetch;
    if (!this.fetchFn) {
      throw new SplitSMSError("fetch is not available; pass fetch in options for Node < 18");
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.fetchFn(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const data = (await res.json().catch(() => ({}))) as T & {
          error?: { message?: string; code?: string };
        };
        if (!res.ok) throwFromResponse(res.status, data, res.statusText);
        return data;
      } catch (e) {
        lastError = e;
        if (e instanceof SplitSMSError && e.status && e.status < 500) throw e;
        if (attempt === this.maxRetries) throw e;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastError;
  }
}
