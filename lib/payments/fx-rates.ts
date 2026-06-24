import { prisma } from "@/lib/db";

const FX_CACHE_KEY = "fx_rate_ghs";
const CACHE_TTL_MS = 60 * 60 * 1000;
const RATE_API_URL = "https://open.er-api.com/v6/latest/GHS";

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

let memoryCache: { rates: Record<string, number>; fetchedAt: number; source: string } | null = null;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function loadCachedRates(): Promise<GhsRateCache | null> {
  const row = await prisma.platformSetting.findUnique({ where: { key: FX_CACHE_KEY } });
  if (!row?.value || typeof row.value !== "object") return null;
  const cached = row.value as GhsRateCache;
  if (!cached.rates || typeof cached.rates !== "object") return null;
  return cached;
}

async function saveCachedRates(rates: Record<string, number>, source: string) {
  const value: GhsRateCache = {
    rates,
    fetchedAt: new Date().toISOString(),
    source,
  };
  await prisma.platformSetting.upsert({
    where: { key: FX_CACHE_KEY },
    update: { value },
    create: { key: FX_CACHE_KEY, value },
  });
}

async function fetchGhsRates(): Promise<GhsRateCache> {
  const res = await fetch(RATE_API_URL, { cache: "no-store" });
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

  memoryCache = {
    rates,
    fetchedAt: Date.now(),
    source: payload.source,
  };
  await saveCachedRates(rates, payload.source);
  return payload;
}

async function getGhsRates(): Promise<GhsRateCache> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return {
      rates: memoryCache.rates,
      fetchedAt: new Date(memoryCache.fetchedAt).toISOString(),
      source: memoryCache.source,
    };
  }

  const cached = await loadCachedRates();
  if (cached?.fetchedAt) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < CACHE_TTL_MS) {
      memoryCache = {
        rates: cached.rates,
        fetchedAt: new Date(cached.fetchedAt).getTime(),
        source: cached.source,
      };
      return cached;
    }
  }

  try {
    return await fetchGhsRates();
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

  const { rates, fetchedAt, source } = await getGhsRates();
  const rate = rates[target];
  if (!rate || rate <= 0) {
    throw new Error(`Exchange rate for GHS → ${target} is unavailable`);
  }

  return { rate, fetchedAt, source };
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
