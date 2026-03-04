/**
 * Metaculus forecasting question service.
 *
 * Metaculus API: https://www.metaculus.com/api2/questions/
 * Public, no auth needed.
 * Filters for geopolitical questions (category filtering).
 */

import type { MetaculusQuestion } from '../../../../src/generated/server/worldmonitor/metaculus/v1/service_server';

import { CHROME_UA } from '../../../_shared/constants';

const METACULUS_API_BASE = 'https://www.metaculus.com/api2';
const FETCH_TIMEOUT = 8000;

// ---------- Internal Metaculus API types ----------

interface MetaculusApiQuestion {
  id: number;
  title?: string;
  url?: string;
  created_time?: string;
  publish_time?: string;
  close_time?: string;
  resolve_time?: string;
  possibilities?: { type?: string };
  community_prediction?: {
    full?: { q2?: number };
  };
  number_of_forecasters?: number;
  status?: string;
  type?: string;
  group?: unknown;
  categories?: string[];
}

interface MetaculusApiResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: MetaculusApiQuestion[];
}

// ---------- Parsing ----------

/** Parse a single Metaculus API question into a proto MetaculusQuestion. */
function mapMetaculusQuestion(raw: MetaculusApiQuestion): MetaculusQuestion {
  const closesAtMs = raw.close_time ? Date.parse(raw.close_time) : 0;
  const resolveTimeMs = raw.resolve_time ? Date.parse(raw.resolve_time) : 0;
  const communityPrediction = raw.community_prediction?.full?.q2 ?? 0.5;
  const questionType = raw.possibilities?.type || '';
  const relativeUrl = raw.url || '';

  return {
    id: raw.id || 0,
    title: raw.title || '',
    communityPrediction,
    forecasterCount: raw.number_of_forecasters ?? 0,
    url: relativeUrl.startsWith('http')
      ? relativeUrl
      : `https://www.metaculus.com${relativeUrl}`,
    closesAt: Number.isFinite(closesAtMs) ? closesAtMs : 0,
    resolveTime: Number.isFinite(resolveTimeMs) ? resolveTimeMs : 0,
    category: Array.isArray(raw.categories) && raw.categories.length > 0
      ? raw.categories[0]!
      : '',
    status: raw.status || '',
    questionType,
  };
}

/** Parse the Metaculus API response into an array of MetaculusQuestion. */
export function parseMetaculusQuestions(data: unknown): MetaculusQuestion[] {
  if (!data || typeof data !== 'object') return [];
  const response = data as MetaculusApiResponse;
  if (!Array.isArray(response.results)) return [];
  return response.results.map(mapMetaculusQuestion);
}

// ---------- Filtering ----------

/** Filter questions by query string and/or category. */
export function filterMetaculusQuestions(
  questions: MetaculusQuestion[],
  query: string,
  category?: string,
): MetaculusQuestion[] {
  let result = questions;

  if (query) {
    const q = query.toLowerCase();
    result = result.filter((qn) => qn.title.toLowerCase().includes(q));
  }

  if (category) {
    const c = category.toLowerCase();
    result = result.filter((qn) => qn.category.toLowerCase() === c);
  }

  return result;
}

// ---------- Fetching ----------

interface MetaculusFetchResult {
  questions: MetaculusQuestion[];
  totalCount: number;
  nextOffset: number | null;
}

/** Fetch questions from the Metaculus public API. Returns null on failure. */
export async function fetchMetaculusQuestions(
  limit: number,
  offset: number,
): Promise<MetaculusFetchResult | null> {
  try {
    const params = new URLSearchParams({
      limit: String(Math.max(1, Math.min(100, limit))),
      offset: String(Math.max(0, offset)),
      status: 'open',
      type: 'forecast',
      order_by: '-activity',
    });

    const response = await fetch(
      `${METACULUS_API_BASE}/questions/?${params}`,
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
    const questions = parseMetaculusQuestions(data);
    const apiResponse = data as MetaculusApiResponse;

    // Parse next offset from the "next" URL if present
    let nextOffset: number | null = null;
    if (apiResponse.next) {
      try {
        const nextUrl = new URL(apiResponse.next);
        const nextOffsetStr = nextUrl.searchParams.get('offset');
        if (nextOffsetStr) nextOffset = parseInt(nextOffsetStr, 10);
      } catch { /* ignore parse error */ }
    }

    return {
      questions,
      totalCount: apiResponse.count ?? 0,
      nextOffset,
    };
  } catch {
    return null;
  }
}
