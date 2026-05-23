import type { HttpClient } from "../utils/http.js";
export declare class WalletResource {
    private readonly http;
    constructor(http: HttpClient);
    balance(): Promise<Record<string, unknown>>;
    /** Alias for account-level balance */
    accountBalance(): Promise<Record<string, unknown>>;
    transactions(params?: Record<string, string | number | undefined>): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=index.d.ts.map