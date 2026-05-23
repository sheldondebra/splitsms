export type HttpClientOptions = {
    apiKey: string;
    baseUrl?: string;
    maxRetries?: number;
    fetch?: typeof fetch;
};
export declare class HttpClient {
    readonly apiKey: string;
    readonly baseUrl: string;
    private readonly maxRetries;
    private readonly fetchFn;
    constructor(options: HttpClientOptions);
    request<T>(method: string, path: string, body?: unknown): Promise<T>;
}
//# sourceMappingURL=http.d.ts.map