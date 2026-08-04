import { prisma } from "@/lib/db";

const FX_CACHE_KEY = "fx_rate_ghs";
const GOOGLE_CACHE_PREFIX = "fx_rate_google_";
const CACHE_TTL_MS = 15 * 60 * 1000;
const FALLBACK_API_URL = "https://open.er-api.com/v6/latest/GHS";

export type FxConversion = {
  sourceCurrency: string;
  sourceAmount: number;
  chargeCurrency: string;
  chargeAmount: number;
  rate: number;
  rateFetchedAt: string;
  rateSource: string;
};

type GhsRateCache = {
  rates: Record<string, number>;
  fetchedAt: string;
  source: string;
};

type PairRateCache = {
  rate: number;
  fetchedAt: string;
  source: string;
};

let memoryBulkCache: { rates: Record<string, number>; fetchedAt: number; source: string } | null =
  null;
const memoryPairCache = new Map<string, { rate: number; fetchedAt: number; source: string }>();

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function pairCacheKey(from: string, to: string) {
  return `${from}_${to}`;
}

async function loadCachedRates(): Promise<GhsRateCache | null> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: FX_CACHE_KEY } });
    if (!row?.value || typeof row.value !== "object") return null;
    const cached = row.value as GhsRateCache;
    if (!cached.rates || typeof cached.rates !== "object") return null;
    return cached;
  } catch {
    return null;
  }
}

async function saveCachedRates(rates: Record<string, number>, source: string) {
  const value: GhsRateCache = {
    rates,
    fetchedAt: new Date().toISOString(),
    source,
  };
  try {
    await prisma.platformSetting.upsert({
      where: { key: FX_CACHE_KEY },
      update: { value },
      create: { key: FX_CACHE_KEY, value },
    });
  } catch {
    // Cache is best-effort — rate fetch should still succeed.
  }
}

async function loadCachedPairRate(from: string, to: string): Promise<PairRateCache | null> {
  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: `${GOOGLE_CACHE_PREFIX}${pairCacheKey(from, to)}` },
    });
    if (!row?.value || typeof row.value !== "object") return null;
    const cached = row.value as PairRateCache;
    if (typeof cached.rate !== "number" || cached.rate <= 0) return null;
    return cached;
  } catch {
    return null;
  }
}

async function saveCachedPairRate(from: string, to: string, rate: number, source: string) {
  const value: PairRateCache = {
    rate,
    fetchedAt: new Date().toISOString(),
    source,
  };
  try {
    await prisma.platformSetting.upsert({
      where: { key: `${GOOGLE_CACHE_PREFIX}${pairCacheKey(from, to)}` },
      update: { value },
      create: { key: `${GOOGLE_CACHE_PREFIX}${pairCacheKey(from, to)}`, value },
    });
  } catch {
    // Cache is best-effort — rate fetch should still succeed.
  }
}

function parseGoogleFinanceRate(html: string): number | null {
  const match = html.match(
    /class="gO24Ff">([^<]+)<\/div>[\s\S]{0,800}?jsname="Pdsbrc"[^>]*>\s*<span>([0-9][0-9,]*(?:\.[0-9]+)?)<\/span>/,
  );
  if (!match) return null;
  const rate = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

async function fetchGoogleFinanceRate(from: string, to: string): Promise<PairRateCache> {
  const url = `https://www.google.com/finance/quote/${from}-${to}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SplitSMSBot/1.0; +https://splitsms.com)",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Google Finance HTTP ${res.status}`);
  }

  const html = await res.text();
  const rate = parseGoogleFinanceRate(html);
  if (!rate) {
    throw new Error(`Could not parse Google Finance rate for ${from}/${to}`);
  }

  const payload: PairRateCache = {
    rate,
    fetchedAt: new Date().toISOString(),
    source: "google-finance",
  };

  memoryPairCache.set(pairCacheKey(from, to), {
    rate,
    fetchedAt: Date.now(),
    source: payload.source,
  });
  await saveCachedPairRate(from, to, rate, payload.source);
  return payload;
}

async function getGooglePairRate(from: string, to: string): Promise<PairRateCache> {
  const key = pairCacheKey(from, to);
  const mem = memoryPairCache.get(key);
  if (mem && Date.now() - mem.fetchedAt < CACHE_TTL_MS) {
    return {
      rate: mem.rate,
      fetchedAt: new Date(mem.fetchedAt).toISOString(),
      source: mem.source,
    };
  }

  const cached = await loadCachedPairRate(from, to);
  if (cached?.fetchedAt) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < CACHE_TTL_MS) {
      memoryPairCache.set(key, {
        rate: cached.rate,
        fetchedAt: new Date(cached.fetchedAt).getTime(),
        source: cached.source,
      });
      return cached;
    }
  }

  try {
    return await fetchGoogleFinanceRate(from, to);
  } catch (error) {
    if (cached?.rate) return cached;
    throw error;
  }
}

async function fetchFallbackGhsRates(): Promise<GhsRateCache> {
  const res = await fetch(FALLBACK_API_URL, { cache: "no-store" });
  const data = (await res.json()) as {
    result?: string;
    base_code?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };

  if (!res.ok || data.result !== "success" || !data.rates) {
    throw new Error("Could not fetch current exchange rates");
  }

  const rates = Object.fromEntries(
    Object.entries(data.rates).map(([code, rate]) => [code.toUpperCase(), rate]),
  );

  const payload: GhsRateCache = {
    rates,
    fetchedAt: data.time_last_update_utc ?? new Date().toISOString(),
    source: "exchangerate-api.com",
  };

  memoryBulkCache = {
    rates,
    fetchedAt: Date.now(),
    source: payload.source,
  };
  await saveCachedRates(rates, payload.source);
  return payload;
}

async function getFallbackGhsRates(): Promise<GhsRateCache> {
  if (memoryBulkCache && Date.now() - memoryBulkCache.fetchedAt < CACHE_TTL_MS) {
    return {
      rates: memoryBulkCache.rates,
      fetchedAt: new Date(memoryBulkCache.fetchedAt).toISOString(),
      source: memoryBulkCache.source,
    };
  }

  const cached = await loadCachedRates();
  if (cached?.fetchedAt) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < CACHE_TTL_MS) {
      memoryBulkCache = {
        rates: cached.rates,
        fetchedAt: new Date(cached.fetchedAt).getTime(),
        source: cached.source,
      };
      return cached;
    }
  }

  try {
    return await fetchFallbackGhsRates();
  } catch (error) {
    if (cached?.rates) return cached;
    throw error;
  }
}

export async function getGhsToCurrencyRate(targetCurrency: string) {
  const target = targetCurrency.trim().toUpperCase();
  if (target === "GHS") {
    return {
      rate: 1,
      fetchedAt: new Date().toISOString(),
      source: "none",
    };
  }

  try {
    return await getGooglePairRate("GHS", target);
  } catch {
    const { rates, fetchedAt, source } = await getFallbackGhsRates();
    const rate = rates[target];
    if (!rate || rate <= 0) {
      throw new Error(`Exchange rate for GHS → ${target} is unavailable`);
    }
    return { rate, fetchedAt, source };
  }
}

export async function convertGhsAmount(amount: number, targetCurrency: string): Promise<FxConversion> {
  const sourceAmount = roundMoney(amount);
  const chargeCurrency = targetCurrency.trim().toUpperCase();
  const { rate, fetchedAt, source } = await getGhsToCurrencyRate(chargeCurrency);

  return {
    sourceCurrency: "GHS",
    sourceAmount,
    chargeCurrency,
    chargeAmount: roundMoney(sourceAmount * rate),
    rate,
    rateFetchedAt: fetchedAt,
    rateSource: source,
  };
}

export async function prepareStripeCharge(
  amount: number,
  walletCurrency: string,
  stripeCurrency: string,
): Promise<FxConversion | { error: string }> {
  const source = walletCurrency.trim().toUpperCase();
  const charge = stripeCurrency.trim().toUpperCase();

  if (source === charge) {
    return {
      sourceCurrency: source,
      sourceAmount: roundMoney(amount),
      chargeCurrency: charge,
      chargeAmount: roundMoney(amount),
      rate: 1,
      rateFetchedAt: new Date().toISOString(),
      rateSource: "none",
    };
  }

  if (source !== "GHS") {
    return {
      error: `Stripe checkout for ${source} wallets is not supported yet. Use Paystack or a GHS wallet.`,
    };
  }

  try {
    return await convertGhsAmount(amount, charge);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Exchange rate unavailable";
    return { error: message };
  }
}

export async function getStripeFxPreview(walletCurrency: string, stripeCurrency: string) {
  const wallet = walletCurrency.trim().toUpperCase();
  const stripe = stripeCurrency.trim().toUpperCase();

  if (wallet !== "GHS" || wallet === stripe) {
    return null;
  }

  try {
    const { rate, fetchedAt, source } = await getGhsToCurrencyRate(stripe);
    return {
      walletCurrency: wallet,
      chargeCurrency: stripe,
      rate,
      fetchedAt,
      source,
    };
  } catch {
    return null;
  }
}
