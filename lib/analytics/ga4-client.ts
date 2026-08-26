import { createPrivateKey, createSign } from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ANALYTICS_READONLY = "https://www.googleapis.com/auth/analytics.readonly";
const DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

type CachedToken = { token: string; expiresAt: number };
let cached: CachedToken | null = null;

function credentials() {
  const clientEmail = process.env.GOOGLE_GA_SA_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_GA_SA_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!clientEmail || !privateKey) return null;
  return { clientEmail, privateKey };
}

function signJwt(email: string, pem: string, scope: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: email, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const key = createPrivateKey(pem);
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(key).toString("base64url");
  return `${unsigned}.${signature}`;
}

async function getAccessToken(): Promise<string> {
  const creds = credentials();
  if (!creds) throw new Error("ga4_sa_missing");
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const assertion = signJwt(creds.clientEmail, creds.privateKey, ANALYTICS_READONLY);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "ga4_sa_token");
  }
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
}

type Ga4ReportRow = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };
type Ga4ReportResponse = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: Ga4ReportRow[];
  totals?: Ga4ReportRow[];
};

async function callDataApi(propertyId: string, path: string, body: unknown) {
  const token = await getAccessToken();
  const res = await fetch(`${DATA_API_BASE}/properties/${propertyId}:${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message || `GA4 request failed (${res.status})`;
    throw new Error(message);
  }
  return data as Ga4ReportResponse;
}

function rowsToRecords(report: Ga4ReportResponse): Record<string, string>[] {
  const dimNames = (report.dimensionHeaders ?? []).map((h) => h.name);
  const metricNames = (report.metricHeaders ?? []).map((h) => h.name);
  return (report.rows ?? []).map((row) => {
    const record: Record<string, string> = {};
    row.dimensionValues.forEach((v, i) => (record[dimNames[i]] = v.value));
    row.metricValues.forEach((v, i) => (record[metricNames[i]] = v.value));
    return record;
  });
}

export type Ga4TrafficSummary = {
  totals: { activeUsers: number; sessions: number; screenPageViews: number; averageSessionDurationSec: number };
  daily: { date: string; activeUsers: number; sessions: number }[];
  topPages: { path: string; views: number }[];
  channels: { channel: string; sessions: number }[];
  devices: { device: string; users: number }[];
  countries: { country: string; users: number }[];
  realtimeActiveUsers: number;
};

/** Pulls a small, opinionated bundle of GA4 stats for the admin traffic dashboard. */
export async function fetchGa4TrafficSummary(
  propertyId: string,
  days: number,
): Promise<Ga4TrafficSummary> {
  const dateRange = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  const [totalsReport, dailyReport, pagesReport, channelReport, deviceReport, countryReport, realtime] =
    await Promise.all([
      callDataApi(propertyId, "runReport", {
        dateRanges: dateRange,
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
        ],
      }),
      callDataApi(propertyId, "runReport", {
        dateRanges: dateRange,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      callDataApi(propertyId, "runReport", {
        dateRanges: dateRange,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "10",
      }),
      callDataApi(propertyId, "runReport", {
        dateRanges: dateRange,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "8",
      }),
      callDataApi(propertyId, "runReport", {
        dateRanges: dateRange,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
      callDataApi(propertyId, "runReport", {
        dateRanges: dateRange,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "8",
      }),
      callDataApi(propertyId, "runRealtimeReport", {
        metrics: [{ name: "activeUsers" }],
      }),
    ]);

  const totalsRow = totalsReport.rows?.[0]?.metricValues ?? [];
  const totals = {
    activeUsers: Number(totalsRow[0]?.value ?? 0),
    sessions: Number(totalsRow[1]?.value ?? 0),
    screenPageViews: Number(totalsRow[2]?.value ?? 0),
    averageSessionDurationSec: Math.round(Number(totalsRow[3]?.value ?? 0)),
  };

  const daily = rowsToRecords(dailyReport).map((r) => ({
    date: r.date,
    activeUsers: Number(r.activeUsers ?? 0),
    sessions: Number(r.sessions ?? 0),
  }));

  const topPages = rowsToRecords(pagesReport).map((r) => ({
    path: r.pagePath,
    views: Number(r.screenPageViews ?? 0),
  }));

  const channels = rowsToRecords(channelReport).map((r) => ({
    channel: r.sessionDefaultChannelGroup,
    sessions: Number(r.sessions ?? 0),
  }));

  const devices = rowsToRecords(deviceReport).map((r) => ({
    device: r.deviceCategory,
    users: Number(r.activeUsers ?? 0),
  }));

  const countries = rowsToRecords(countryReport).map((r) => ({
    country: r.country,
    users: Number(r.activeUsers ?? 0),
  }));

  const realtimeActiveUsers = Number(realtime.rows?.[0]?.metricValues?.[0]?.value ?? 0);

  return { totals, daily, topPages, channels, devices, countries, realtimeActiveUsers };
}
