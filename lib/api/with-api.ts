import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api/auth";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logApiRequest } from "@/lib/api/log";
import { apiError } from "@/lib/api/errors";
import { hasPermission, type ApiPermission } from "@/lib/api/permissions";
import type { ApiContext } from "@/lib/api/context";
import {
  featureDisabledMessage,
  isFeatureEnabled,
  type PlatformFeatureId,
} from "@/lib/platform/features";

type ApiHandler = (request: Request, ctx: ApiContext) => Promise<NextResponse>;

export function withApi(
  handler: ApiHandler,
  path: string,
  permission?: ApiPermission,
  options?: { feature?: PlatformFeatureId },
) {
  return async (request: Request) => {
    const start = Date.now();
    const { getClientIpFromRequest } = await import("@/lib/auth/request-ip");
    const resolved = getClientIpFromRequest(request);
    const ip = resolved === "unknown" ? undefined : resolved;

    let requestBytes: number | undefined;
    try {
      const clone = request.clone();
      const text = await clone.text();
      requestBytes = new TextEncoder().encode(text).length;
    } catch {
      /* ignore */
    }

    const ctx = await authenticateApiKey(request.headers.get("authorization"));
    if (!ctx) {
      await logApiRequest({
        method: request.method,
        path,
        statusCode: 401,
        durationMs: Date.now() - start,
        ip,
        requestBytes,
        errorCode: "UNAUTHORIZED",
      });
      return apiError("UNAUTHORIZED", "Invalid or missing API key", 401);
    }

    if (permission && !hasPermission(ctx.permissions, permission)) {
      await logApiRequest({
        userId: ctx.user.id,
        apiKeyId: ctx.apiKeyId,
        method: request.method,
        path,
        statusCode: 403,
        durationMs: Date.now() - start,
        ip,
        requestBytes,
        errorCode: "FORBIDDEN",
      });
      return apiError("FORBIDDEN", `Missing permission: ${permission}`, 403);
    }

    if (options?.feature && !(await isFeatureEnabled(options.feature))) {
      await logApiRequest({
        userId: ctx.user.id,
        apiKeyId: ctx.apiKeyId,
        method: request.method,
        path,
        statusCode: 403,
        durationMs: Date.now() - start,
        ip,
        requestBytes,
        errorCode: "FORBIDDEN",
      });
      return apiError("FORBIDDEN", featureDisabledMessage(options.feature), 403);
    }

    const limit = await checkRateLimit(ctx.apiKeyId, ctx.rateLimitPerMinute);
    if (!limit.ok) {
      await logApiRequest({
        userId: ctx.user.id,
        apiKeyId: ctx.apiKeyId,
        method: request.method,
        path,
        statusCode: 429,
        durationMs: Date.now() - start,
        ip,
        requestBytes,
        errorCode: "RATE_LIMITED",
      });
      return apiError("RATE_LIMITED", "Rate limit exceeded", 429, {
        retry_after_sec: Math.ceil((limit.resetAt - Date.now()) / 1000),
      });
    }

    const response = await handler(request, ctx);
    const headers = new Headers(response.headers);
    headers.set("X-RateLimit-Remaining", String(limit.remaining));

    await logApiRequest({
      userId: ctx.user.id,
      apiKeyId: ctx.apiKeyId,
      method: request.method,
      path,
      statusCode: response.status,
      durationMs: Date.now() - start,
      ip,
      requestBytes,
      errorCode: response.status >= 400 ? "REQUEST_FAILED" : undefined,
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
