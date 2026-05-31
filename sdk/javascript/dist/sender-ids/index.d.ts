import type { HttpClient } from "../utils/http.js";
export type RegisterSenderIdInput = {
    value: string;
    country_code: string;
    purpose?: string;
    customer_id?: string;
    set_default?: boolean;
};
export declare class SenderIdsResource {
    private readonly http;
    constructor(http: HttpClient);
    list(customerId?: string): Promise<Record<string, unknown>>;
    register(input: RegisterSenderIdInput): Promise<Record<string, unknown>>;
    get(id: string): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=index.d.ts.map