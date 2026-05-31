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
export declare class ConnectResource {
    private readonly http;
    constructor(http: HttpClient);
    listCustomers(params?: {
        limit?: number;
        external_ref?: string;
    }): Promise<Record<string, unknown>>;
    createCustomer(input: CreateConnectCustomerInput): Promise<Record<string, unknown>>;
    getCustomer(id: string): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=index.d.ts.map