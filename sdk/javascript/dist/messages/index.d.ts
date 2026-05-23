import type { HttpClient } from "../utils/http.js";
export type SendMessageInput = {
    sender?: string;
    from?: string;
    message: string;
    to?: string;
    recipients?: string[];
    countryCode?: string;
};
export declare class MessagesResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Send one or more SMS messages */
    send(input: SendMessageInput): Promise<Record<string, unknown>>;
    /** Get delivery status for a message */
    get(id: string): Promise<Record<string, unknown>>;
    /** List delivery reports */
    reports(params?: Record<string, string | number | undefined>): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=index.d.ts.map