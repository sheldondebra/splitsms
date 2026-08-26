import { prisma } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/google/crypto";
import {
  hasScopes,
  mergeScopes,
  missingScopes,
} from "@/lib/google/connection-utils";
import {
  fetchGoogleUserInfo,
  getGoogleClientCredentials,
  refreshGoogleAccessToken,
  revokeGoogleToken,
  scopeListFromTokenResponse,
} from "@/lib/google/oauth-connect";
import { GOOGLE_BASE_SCOPES } from "@/lib/google/scopes";

export type GoogleConnectionPublic = {
  email: string;
  googleSubject: string;
  scopes: string[];
  connectedAt: Date;
  updatedAt: Date;
  lastError: string | null;
  name: string | null;
  pictureUrl: string | null;
};

export type AccessTokenResult =
  | { ok: true; accessToken: string }
  | {
      ok: false;
      code: "not_connected" | "needs_scopes" | "reconnect" | "config";
      missingScopes?: string[];
    };

export async function getGoogleConnectionPublic(
  userId: string,
): Promise<GoogleConnectionPublic | null> {
  const row = await prisma.googleConnection.findUnique({
    where: { userId },
    include: { user: { select: { fullName: true } } },
  });
  if (!row) return null;
  return {
    email: row.email,
    googleSubject: row.googleSubject,
    scopes: row.scopes,
    connectedAt: row.connectedAt,
    updatedAt: row.updatedAt,
    lastError: row.lastError,
    name: row.user.fullName.trim() || null,
    pictureUrl: null,
  };
}

export async function getGoogleConnectionProfile(
  userId: string,
): Promise<GoogleConnectionPublic | null> {
  const connection = await getGoogleConnectionPublic(userId);
  if (!connection) return null;
  const token = await getAccessTokenForUser(userId);
  if (!token.ok) return connection;
  const info = await fetchGoogleUserInfo(token.accessToken);
  return {
    ...connection,
    name: info?.fullName?.trim() || connection.name,
    pictureUrl: info?.picture ?? null,
  };
}

export async function upsertGoogleConnectionFromOAuth(opts: {
  userId: string;
  googleSubject: string;
  email: string;
  refreshToken?: string;
  accessToken: string;
  expiresIn?: number;
  grantedScopes: string[];
}) {
  const existing = await prisma.googleConnection.findUnique({
    where: { userId: opts.userId },
  });

  const scopes = mergeScopes(opts.grantedScopes, [...GOOGLE_BASE_SCOPES]);

  let encryptedRefreshToken = existing?.encryptedRefreshToken;
  if (opts.refreshToken) {
    encryptedRefreshToken = encryptToken(opts.refreshToken);
  }
  if (!encryptedRefreshToken) {
    throw new Error("missing_refresh_token");
  }

  const tokenExpiry =
    opts.expiresIn != null
      ? new Date(Date.now() + opts.expiresIn * 1000)
      : existing?.tokenExpiry ?? null;

  await prisma.googleConnection.upsert({
    where: { userId: opts.userId },
    create: {
      userId: opts.userId,
      googleSubject: opts.googleSubject,
      email: opts.email,
      encryptedRefreshToken,
      scopes,
      tokenExpiry,
      lastError: null,
    },
    update: {
      googleSubject: opts.googleSubject,
      email: opts.email,
      encryptedRefreshToken,
      // Trust the latest OAuth grant (include_granted_scopes returns the full set).
      scopes,
      tokenExpiry,
      lastError: null,
    },
  });

  // accessToken is intentionally unused after identity fetch — kept in signature for call-site clarity
  void opts.accessToken;
}

export async function getAccessTokenForUser(
  userId: string,
  requiredScopes: string[] = [],
): Promise<AccessTokenResult> {
  const credentials = getGoogleClientCredentials();
  if (!credentials) return { ok: false, code: "config" };

  const row = await prisma.googleConnection.findUnique({ where: { userId } });
  if (!row) return { ok: false, code: "not_connected" };

  if (requiredScopes.length > 0 && !hasScopes(row.scopes, requiredScopes)) {
    return {
      ok: false,
      code: "needs_scopes",
      missingScopes: missingScopes(row.scopes, requiredScopes),
    };
  }

  let refreshToken: string;
  try {
    refreshToken = decryptToken(row.encryptedRefreshToken);
  } catch {
    await prisma.googleConnection.update({
      where: { userId },
      data: { lastError: "decrypt_failed" },
    });
    return { ok: false, code: "reconnect" };
  }

  const refreshed = await refreshGoogleAccessToken({
    refreshToken,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
  });

  if ("error" in refreshed) {
    await prisma.googleConnection.update({
      where: { userId },
      data: { lastError: refreshed.error },
    });
    return { ok: false, code: "reconnect" };
  }

  const nextScopes = scopeListFromTokenResponse(refreshed.scope, row.scopes);
  // When Google returns scopes on refresh, replace stored scopes (don't keep stale grants).
  const scopes =
    refreshed.scope && refreshed.scope.trim()
      ? mergeScopes(nextScopes, [...GOOGLE_BASE_SCOPES])
      : row.scopes;

  await prisma.googleConnection.update({
    where: { userId },
    data: {
      scopes,
      tokenExpiry:
        refreshed.expiresIn != null
          ? new Date(Date.now() + refreshed.expiresIn * 1000)
          : row.tokenExpiry,
      lastError: null,
    },
  });

  return { ok: true, accessToken: refreshed.accessToken };
}

export async function disconnectGoogleConnection(userId: string): Promise<void> {
  const row = await prisma.googleConnection.findUnique({ where: { userId } });
  if (!row) return;

  try {
    const refreshToken = decryptToken(row.encryptedRefreshToken);
    await revokeGoogleToken(refreshToken);
  } catch {
    // best effort revoke
  }

  await prisma.googleConnection.delete({ where: { userId } });
}

export async function identityFromAccessToken(accessToken: string) {
  return fetchGoogleUserInfo(accessToken);
}

export { hasScopes, missingScopes, mergeScopes };
