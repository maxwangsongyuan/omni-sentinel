import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('Metaculus service', () => {
  // --- Metaculus API response fixtures ---

  const METACULUS_QUESTIONS_RESPONSE = {
    count: 3,
    next: 'https://www.metaculus.com/api2/questions/?offset=20&limit=20',
    previous: null,
    results: [
      {
        id: 11276,
        title: 'Will Russia control Kyiv by end of 2025?',
        url: '/questions/11276/will-russia-control-kyiv/',
        created_time: '2022-03-01T12:00:00Z',
        publish_time: '2022-03-01T12:00:00Z',
        close_time: '2025-12-31T23:59:59Z',
        resolve_time: '2026-01-15T00:00:00Z',
        possibilities: { type: 'binary' },
        community_prediction: {
          full: { q2: 0.03 },
        },
        number_of_forecasters: 1250,
        status: 'open',
        type: 'forecast',
        group: null,
        categories: ['geopolitics'],
      },
      {
        id: 15832,
        title: 'Will China and Taiwan engage in armed conflict before 2026?',
        url: '/questions/15832/china-taiwan-conflict/',
        created_time: '2023-06-15T08:00:00Z',
        publish_time: '2023-06-15T08:00:00Z',
        close_time: '2025-12-31T23:59:59Z',
        resolve_time: '2026-03-01T00:00:00Z',
        possibilities: { type: 'binary' },
        community_prediction: {
          full: { q2: 0.05 },
        },
        number_of_forecasters: 890,
        status: 'open',
        type: 'forecast',
        group: null,
        categories: ['geopolitics', 'conflict'],
      },
      {
        id: 20100,
        title: 'Will global GDP growth exceed 3% in 2025?',
        url: '/questions/20100/global-gdp-growth/',
        created_time: '2024-01-10T10:00:00Z',
        publish_time: '2024-01-10T10:00:00Z',
        close_time: '2026-03-31T23:59:59Z',
        resolve_time: '2026-06-01T00:00:00Z',
        possibilities: { type: 'binary' },
        community_prediction: {
          full: { q2: 0.42 },
        },
        number_of_forecasters: 320,
        status: 'open',
        type: 'forecast',
        group: null,
        categories: ['economics'],
      },
    ],
  };

  const METACULUS_EMPTY_RESPONSE = {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };

  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  function restoreFetch() {
    globalThis.fetch = originalFetch;
  }

  describe('parseMetaculusQuestions', () => {
    it('parses valid Metaculus API response into MetaculusQuestion array', async () => {
      const { parseMetaculusQuestions } = await import('./metaculus.ts');
      const questions = parseMetaculusQuestions(METACULUS_QUESTIONS_RESPONSE);

      assert.equal(questions.length, 3);

      const first = questions[0]!;
      assert.equal(first.id, 11276);
      assert.equal(first.title, 'Will Russia control Kyiv by end of 2025?');
      assert.equal(first.communityPrediction, 0.03);
      assert.equal(first.forecasterCount, 1250);
      assert.equal(first.url, 'https://www.metaculus.com/questions/11276/will-russia-control-kyiv/');
      assert.equal(first.status, 'open');
      assert.equal(first.questionType, 'binary');
      assert.ok(first.closesAt > 0, 'closesAt should be a positive timestamp');
      assert.ok(first.resolveTime > 0, 'resolveTime should be a positive timestamp');
    });

    it('returns empty array for empty response', async () => {
      const { parseMetaculusQuestions } = await import('./metaculus.ts');
      const questions = parseMetaculusQuestions(METACULUS_EMPTY_RESPONSE);
      assert.equal(questions.length, 0);
    });

    it('handles missing community_prediction gracefully', async () => {
      const { parseMetaculusQuestions } = await import('./metaculus.ts');
      const questions = parseMetaculusQuestions({
        results: [
          {
            id: 99999,
            title: 'Test question',
            url: '/questions/99999/test/',
            close_time: '2025-12-31T23:59:59Z',
            possibilities: { type: 'binary' },
            number_of_forecasters: 0,
            status: 'open',
          },
        ],
      });
      assert.equal(questions.length, 1);
      assert.equal(questions[0]!.communityPrediction, 0.5); // default
      assert.equal(questions[0]!.forecasterCount, 0);
    });

    it('handles null/undefined input gracefully', async () => {
      const { parseMetaculusQuestions } = await import('./metaculus.ts');
      assert.deepEqual(parseMetaculusQuestions(null), []);
      assert.deepEqual(parseMetaculusQuestions(undefined), []);
      assert.deepEqual(parseMetaculusQuestions({}), []);
    });

    it('extracts category from categories array', async () => {
      const { parseMetaculusQuestions } = await import('./metaculus.ts');
      const questions = parseMetaculusQuestions(METACULUS_QUESTIONS_RESPONSE);
      assert.equal(questions[0]!.category, 'geopolitics');
      assert.equal(questions[2]!.category, 'economics');
    });
  });

  describe('filterMetaculusQuestions', () => {
    it('filters by query string (case insensitive)', async () => {
      const { parseMetaculusQuestions, filterMetaculusQuestions } = await import('./metaculus.ts');
      const questions = parseMetaculusQuestions(METACULUS_QUESTIONS_RESPONSE);
      const filtered = filterMetaculusQuestions(questions, 'china');
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0]!.id, 15832);
    });

    it('returns all questions when query is empty', async () => {
      const { parseMetaculusQuestions, filterMetaculusQuestions } = await import('./metaculus.ts');
      const questions = parseMetaculusQuestions(METACULUS_QUESTIONS_RESPONSE);
      const filtered = filterMetaculusQuestions(questions, '');
      assert.equal(filtered.length, 3);
    });

    it('filters by category', async () => {
      const { parseMetaculusQuestions, filterMetaculusQuestions } = await import('./metaculus.ts');
      const questions = parseMetaculusQuestions(METACULUS_QUESTIONS_RESPONSE);
      const filtered = filterMetaculusQuestions(questions, '', 'economics');
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0]!.id, 20100);
    });
  });

  describe('fetchMetaculusQuestions (integration)', () => {
    it('fetches and parses questions from API', async () => {
      globalThis.fetch = mock.fn(async () => {
        return new Response(JSON.stringify(METACULUS_QUESTIONS_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof globalThis.fetch;

      try {
        const { fetchMetaculusQuestions } = await import('./metaculus.ts');
        const result = await fetchMetaculusQuestions(20, 0);
        assert.ok(result !== null);
        assert.ok(result!.questions.length > 0);
        assert.equal(result!.totalCount, 3);
      } finally {
        restoreFetch();
      }
    });

    it('returns null on API failure', async () => {
      globalThis.fetch = mock.fn(async () => {
        return new Response('Internal Server Error', { status: 500 });
      }) as unknown as typeof globalThis.fetch;

      try {
        const { fetchMetaculusQuestions } = await import('./metaculus.ts');
        const result = await fetchMetaculusQuestions(20, 0);
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
        const { fetchMetaculusQuestions } = await import('./metaculus.ts');
        const result = await fetchMetaculusQuestions(20, 0);
        assert.equal(result, null);
      } finally {
        restoreFetch();
      }
    });
  });
});
