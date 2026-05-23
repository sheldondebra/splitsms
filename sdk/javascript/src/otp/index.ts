import type { HttpClient } from "../utils/http.js";

export class OtpResource {
  constructor(private readonly http: HttpClient) {}

  send(phone: string, countryCode = "GH") {
    return this.http.request<Record<string, unknown>>("POST", "/api/v1/otp/send", {
      phone,
      countryCode,
    });
  }

  verify(phone: string, code: string) {
    return this.http.request<Record<string, unknown>>("POST", "/api/v1/otp/verify", {
      phone,
      code,
    });
  }
}
