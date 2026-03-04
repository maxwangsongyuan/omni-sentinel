/**
 * Kalshi prediction market service.
 *
 * Kalshi API: https://trading-api.kalshi.com/trade-api/v2/markets
 * Public, no auth needed for read-only market data.
 * Filters for geopolitical/conflict markets relevant to OSINT.
 */

import type { KalshiMarket } from '../../../../src/generated/server/worldmonitor/kalshi/v1/service_server';

import { CHROME_UA } from '../../../_shared/constants';

const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';
const FETCH_TIMEOUT = 8000;

// ---------- Internal Kalshi API types ----------

interface KalshiApiMarket {
  ticker: string;
  event_ticker?: string;
  title?: string;
  subtitle?: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  volume?: number;
  open_interest?: number;
  status?: string;
  close_time?: string;
  category?: string;
  result?: string;
}

interface KalshiApiResponse {
  markets?: KalshiApiMarket[];
  cursor?: string;
}

// ---------- Parsing ----------

/** Parse a single Kalshi API market into a proto KalshiMarket. */
function mapKalshiMarket(raw: KalshiApiMarket): KalshiMarket {
  const yesPrice = raw.last_price ?? 0.5;
  const noPrice = Math.round((1 - yesPrice) * 100) / 100;
  const closesAtMs = raw.close_time ? Date.parse(raw.close_time) : 0;
  const eventTicker = raw.event_ticker || '';

  return {
    ticker: raw.ticker || '',
    title: raw.title || '',
    yesPrice,
    noPrice,
    volume: raw.volume ?? 0,
    openInterest: raw.open_interest ?? 0,
    url: eventTicker
      ? `https://kalshi.com/markets/${eventTicker}/${raw.ticker}`
      : `https://kalshi.com/markets/${raw.ticker}`,
    closesAt: Number.isFinite(closesAtMs) ? closesAtMs : 0,
    category: raw.category || '',
    status: raw.status || '',
    eventTicker,
  };
}

/** Parse the Kalshi API response into an array of KalshiMarket. */
export function parseKalshiMarkets(data: unknown): KalshiMarket[] {
  if (!data || typeof data !== 'object') return [];
  const response = data as KalshiApiResponse;
  if (!Array.isArray(response.markets)) return [];
  return response.markets.map(mapKalshiMarket);
}

// ---------- Filtering ----------

/** Filter markets by query string and/or category. */
export function filterKalshiMarkets(
  markets: KalshiMarket[],
  query: string,
  category?: string,
): KalshiMarket[] {
  let result = markets;

  if (query) {
    const q = query.toLowerCase();
    result = result.filter((m) => m.title.toLowerCase().includes(q));
  }

  if (category) {
    const c = category.toLowerCase();
    result = result.filter((m) => m.category.toLowerCase() === c);
  }

  return result;
}

// ---------- Fetching ----------

interface KalshiFetchResult {
  markets: KalshiMarket[];
  cursor: string;
}

/** Fetch markets from the Kalshi public API. Returns null on failure. */
export async function fetchKalshiMarkets(
  limit: number,
  cursor?: string,
): Promise<KalshiFetchResult | null> {
  try {
    const params = new URLSearchParams({
      limit: String(Math.max(1, Math.min(200, limit))),
      status: 'open',
    });
    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(
      `${KALSHI_API_BASE}/markets?${params}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': CHROME_UA,
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      },
    );

    if (!response.ok) return null;

    const data: unknown = await response.json();
    const markets = parseKalshiMarkets(data);
    const apiResponse = data as KalshiApiResponse;

    return {
      markets,
      cursor: apiResponse.cursor || '',
    };
  } catch {
    return null;
  }
}
