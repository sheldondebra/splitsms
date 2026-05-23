import type { HttpClient } from "../utils/http.js";
export declare class CampaignsResource {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: Record<string, string | number | undefined>): Promise<Record<string, unknown>>;
    get(id: string): Promise<Record<string, unknown>>;
    messages(id: string, params?: Record<string, string | number | undefined>): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=index.d.ts.map