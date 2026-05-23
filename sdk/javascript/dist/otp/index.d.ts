import type { HttpClient } from "../utils/http.js";
export declare class OtpResource {
    private readonly http;
    constructor(http: HttpClient);
    send(phone: string, countryCode?: string): Promise<Record<string, unknown>>;
    verify(phone: string, code: string): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=index.d.ts.map