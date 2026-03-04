import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// Mock the redis module before importing the handler
const mockCachedFetchJson = mock.fn(
  async <T>(_key: string, _ttl: number, fetcher: () => Promise<T | null>): Promise<T | null> => {
    return fetcher();
  },
);

// We need to test the core logic (parsing/mapping), so we import the service module
// and mock global fetch for external API calls.

describe('Kalshi service', () => {
  // --- Kalshi API response fixtures ---

  const KALSHI_MARKETS_RESPONSE = {
    markets: [
      {
        ticker: 'KXWORLDWAR-25',
        event_ticker: 'KXWORLDWAR',
        title: 'Will there be a new world conflict in 2025?',
        subtitle: '',
        yes_bid: 0.03,
        yes_ask: 0.04,
        no_bid: 0.96,
        no_ask: 0.97,
        last_price: 0.04,
        volume: 15230,
        open_interest: 8421,
        status: 'open',
        close_time: '2025-12-31T23:59:59Z',
        category: 'Politics',
        result: '',
      },
      {
        ticker: 'KXCHINATAIWAN-25',
        event_ticker: 'KXCHINATAIWAN',
        title: 'Will China invade Taiwan in 2025?',
        subtitle: '',
        yes_bid: 0.01,
        yes_ask: 0.02,
        no_bid: 0.98,
        no_ask: 0.99,
        last_price: 0.02,
        volume: 42100,
        open_interest: 12000,
        status: 'open',
        close_time: '2025-12-31T23:59:59Z',
        category: 'Politics',
        result: '',
      },
      {
        ticker: 'KXCLOSED-25',
        event_ticker: 'KXCLOSED',
        title: 'Closed market example',
        subtitle: '',
        yes_bid: 0.50,
        yes_ask: 0.51,
        no_bid: 0.49,
        no_ask: 0.50,
        last_price: 0.50,
        volume: 100,
        open_interest: 0,
        status: 'closed',
        close_time: '2025-01-01T00:00:00Z',
        category: 'Sports',
        result: 'yes',
      },
    ],
    cursor: 'next_page_abc',
  };

  const KALSHI_EMPTY_RESPONSE = {
    markets: [],
    cursor: '',
  };

  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  // Restore fetch after each test
  function restoreFetch() {
    globalThis.fetch = originalFetch;
  }

  describe('parseKalshiMarkets', () => {
    it('parses valid Kalshi API response into KalshiMarket array', async () => {
      const { parseKalshiMarkets } = await import('./kalshi.ts');
      const markets = parseKalshiMarkets(KALSHI_MARKETS_RESPONSE);

      assert.equal(markets.length, 3);

      const first = markets[0]!;
      assert.equal(first.ticker, 'KXWORLDWAR-25');
      assert.equal(first.title, 'Will there be a new world conflict in 2025?');
      assert.equal(first.yesPrice, 0.04); // last_price
      assert.equal(first.noPrice, 0.96); // 1 - last_price
      assert.equal(first.volume, 15230);
      assert.equal(first.openInterest, 8421);
      assert.equal(first.url, 'https://kalshi.com/markets/KXWORLDWAR/KXWORLDWAR-25');
      assert.equal(first.status, 'open');
      assert.equal(first.category, 'Politics');
      assert.equal(first.eventTicker, 'KXWORLDWAR');
      assert.ok(first.closesAt > 0, 'closesAt should be a positive timestamp');
    });

    it('returns empty array for empty response', async () => {
      const { parseKalshiMarkets } = await import('./kalshi.ts');
      const markets = parseKalshiMarkets(KALSHI_EMPTY_RESPONSE);
      assert.equal(markets.length, 0);
    });

    it('handles missing fields gracefully', async () => {
      const { parseKalshiMarkets } = await import('./kalshi.ts');
      const markets = parseKalshiMarkets({
        markets: [
          {
            ticker: 'KXTEST',
            title: 'Test',
          },
        ],
      });
      assert.equal(markets.length, 1);
      assert.equal(markets[0]!.ticker, 'KXTEST');
      assert.equal(markets[0]!.yesPrice, 0.5); // default
      assert.equal(markets[0]!.volume, 0);
      assert.equal(markets[0]!.openInterest, 0);
    });

    it('handles null/undefined input gracefully', async () => {
      const { parseKalshiMarkets } = await import('./kalshi.ts');
      assert.deepEqual(parseKalshiMarkets(null), []);
      assert.deepEqual(parseKalshiMarkets(undefined), []);
      assert.deepEqual(parseKalshiMarkets({}), []);
    });
  });

  describe('filterKalshiMarkets', () => {
    it('filters by query string (case insensitive)', async () => {
      const { parseKalshiMarkets, filterKalshiMarkets } = await import('./kalshi.ts');
      const markets = parseKalshiMarkets(KALSHI_MARKETS_RESPONSE);
      const filtered = filterKalshiMarkets(markets, 'china');
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0]!.ticker, 'KXCHINATAIWAN-25');
    });

    it('returns all markets when query is empty', async () => {
      const { parseKalshiMarkets, filterKalshiMarkets } = await import('./kalshi.ts');
      const markets = parseKalshiMarkets(KALSHI_MARKETS_RESPONSE);
      const filtered = filterKalshiMarkets(markets, '');
      assert.equal(filtered.length, 3);
    });

    it('filters by category', async () => {
      const { parseKalshiMarkets, filterKalshiMarkets } = await import('./kalshi.ts');
      const markets = parseKalshiMarkets(KALSHI_MARKETS_RESPONSE);
      const filtered = filterKalshiMarkets(markets, '', 'Sports');
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0]!.ticker, 'KXCLOSED-25');
    });
  });

  describe('fetchKalshiMarkets (integration)', () => {
    it('fetches and parses markets from API', async () => {
      globalThis.fetch = mock.fn(async () => {
        return new Response(JSON.stringify(KALSHI_MARKETS_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof globalThis.fetch;

      try {
        const { fetchKalshiMarkets } = await import('./kalshi.ts');
        const result = await fetchKalshiMarkets(50);
        assert.ok(result !== null);
        assert.ok(result!.markets.length > 0);
        assert.equal(result!.cursor, 'next_page_abc');
      } finally {
        restoreFetch();
      }
    });

    it('returns null on API failure', async () => {
      globalThis.fetch = mock.fn(async () => {
        return new Response('Internal Server Error', { status: 500 });
      }) as unknown as typeof globalThis.fetch;

      try {
        const { fetchKalshiMarkets } = await import('./kalshi.ts');
        const result = await fetchKalshiMarkets(50);
        assert.equal(result, null);
      } finally {
        restoreFetch();
      }
    });

    it('returns null on network error', async () => {
      globalThis.fetch = mock.fn(async () => {
        throw new Error('Network error');
      }) as unknown as typeof globalThis.fetch;

      try {
        const { fetchKalshiMarkets } = await import('./kalshi.ts');
        const result = await fetchKalshiMarkets(50);
        assert.equal(result, null);
      } finally {
        restoreFetch();
      }
    });
  });
});
