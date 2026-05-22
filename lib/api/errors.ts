import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INSUFFICIENT_CREDITS"
  | "INTERNAL_ERROR";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...extra },
    },
    { status },
  );
}

export function apiSuccess<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}
