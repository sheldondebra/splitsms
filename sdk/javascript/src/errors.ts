export class SplitSMSError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "SplitSMSError";
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

export function throwFromResponse(
  status: number,
  data: { error?: { message?: string; code?: string } },
  fallback: string,
): never {
  throw new SplitSMSError(data?.error?.message ?? fallback, {
    code: data?.error?.code,
    status,
  });
}
