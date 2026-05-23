export class SplitSMSError extends Error {
    constructor(message, opts) {
        super(message);
        this.name = "SplitSMSError";
        this.code = opts?.code;
        this.status = opts?.status;
    }
}
export function throwFromResponse(status, data, fallback) {
    throw new SplitSMSError(data?.error?.message ?? fallback, {
        code: data?.error?.code,
        status,
    });
}
