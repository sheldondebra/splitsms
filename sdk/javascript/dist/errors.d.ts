export declare class SplitSMSError extends Error {
    code?: string;
    status?: number;
    constructor(message: string, opts?: {
        code?: string;
        status?: number;
    });
}
export declare function throwFromResponse(status: number, data: {
    error?: {
        message?: string;
        code?: string;
    };
}, fallback: string): never;
//# sourceMappingURL=errors.d.ts.map