# Omni Sentinel Implementation Plan v2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend World Monitor with Claude AI, social media feeds (Reddit, Twitter, Bluesky, YouTube, TikTok, VK), JP 3-60 analysis, government data, historical trajectories, prediction markets, and expanded RSS.

**Architecture:** Proto-first Plugin mode. Each module follows World Monitor's service pattern: `.proto` -> `buf generate` -> server handler -> Edge Function -> client wrapper -> panel component -> feature flag. Sentinel-specific config is extracted to SEPARATE files that merge into existing config to minimize upstream merge conflicts.

**Tech Stack:** TypeScript + vanilla DOM Panel class pattern (NOT Preact JSX — components use a `Panel` base class and `h()` helper from `@/utils/dom-utils.ts`) + MapLibre GL + Deck.gl | Vercel Edge Functions + Railway | Upstash Redis | Anthropic Claude API | buf/sebuf proto codegen

**Source Documents:**
- Design: `docs/plans/2026-03-03-omni-sentinel-design.md`
- Master Checklist: `docs/plans/2026-03-03-omni-sentinel-master-checklist.md`
- Reviews: `docs/reviews/` (security, scalability, cost, feature, ops, synthesis)
- Research: `docs/research/` (global platform map, Twitter/Telegram guide)

**Critical Fork Rule:** NEVER directly edit upstream core files (`summarization.ts`, `panels.ts`, `runtime-config.ts`, `gateway.ts`) except for minimal import+merge lines. Create sentinel-specific config files instead.

---

## Key Architecture Decisions (from reviews + owner)

| # | Decision | Detail |
|---|----------|--------|
| 1 | AI provider chain | PREPEND Claude to existing `API_PROVIDERS`. Keep Browser T5 as last-resort offline fallback. Chain: Claude -> OpenRouter -> existing -> Browser T5 |
| 2 | Claude models | Haiku 4.5 (`claude-haiku-4-5-20251001`) for summarization, Sonnet 4 (`claude-sonnet-4-20250514`) for analysis |
| 3 | Claude cache TTLs | Summarize = 15min, Analyze = 30min |
| 4 | Claude rate limit | 10-20 req/min/IP + daily budget cap ($25 default) |
| 5 | Reddit auth | OAuth2 client credentials (NOT unauthenticated JSON) |
| 6 | Twitter | Adapter pattern: `TwitterDataSource` interface with `TwitterApiIoAdapter` (default, $0.15/1K), `SocialDataAdapter`, `OfficialXApiAdapter` |
| 7 | Bluesky limit | `Math.min(limit, 25)` (actual API max) |
| 8 | YouTube | NEW platform -- YouTube Data API v3 (free tier, 10K units/day) |
| 9 | Error responses | Structured error with `status` field (distinguish "failed" from "no data") |
| 10 | NAVTEX | Enhance existing `list-navigational-warnings` in maritime service. DO NOT create new service. |
| 11 | Config extraction | Sentinel config in separate files, imported/merged into existing |
| 12 | Killswitches | `process.env.MODULE_{NAME}_ENABLED` in each edge function |
| 13 | Deployment | Phased rollout: RSS -> Claude -> Social -> Analyst -> GovData -> Prediction -> Trajectory |
| 14 | Keep ALL features | Build everything including Twitter, TikTok, VK (owner decision) |
| 15 | Facebook | Feasibility research note only, not full implementation |

---

## Execution Strategy

8 worktrees, one per module. Module 0 must complete first. Module 3 depends on Module 1. All others parallel after Module 0.

```
wt-infra      -> Module 0 (Infrastructure)      -> no dependencies
wt-claude     -> Module 1 (Claude AI Provider)   -> depends on Module 0
wt-social     -> Module 2 (Social Media)         -> depends on Module 0
wt-analyst    -> Module 3 (JP 3-60 Analyst)      -> depends on Module 0 + Module 1
wt-govdata    -> Module 4 (Government Data)      -> depends on Module 0
wt-trajectory -> Module 5 (Historical Trajectory) -> depends on Module 0
wt-prediction -> Module 6 (Prediction Markets)   -> depends on Module 0
wt-rss        -> Module 7 (RSS Expansion)        -> no dependencies
```

---

## Module 0: Infrastructure Foundation

**Goal:** Shared utilities that all other modules depend on. MUST complete before any feature module.

### Task 0.1: Input Validation Utility

**Files:**
- Create: `src/utils/validation.ts`
- Create: `src/utils/validation.test.mts`

**Step 1: Write the test file**

```typescript
// src/utils/validation.test.mts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStringParam,
  validateHexParam,
  validateNumberParam,
  sanitizeTextContent,
  sanitizeUrl,
} from './validation';

describe('validateStringParam', () => {
  it('rejects empty strings', () => {
    assert.throws(() => validateStringParam('', 'test'), { message: /test is required/ });
  });

  it('rejects null and undefined', () => {
    assert.throws(() => validateStringParam(null as any, 'test'), { message: /test is required/ });
    assert.throws(() => validateStringParam(undefined as any, 'test'), { message: /test is required/ });
  });

  it('rejects strings exceeding maxLength', () => {
    assert.throws(() => validateStringParam('a'.repeat(101), 'test', 100), { message: /test exceeds maximum length/ });
  });

  it('rejects strings not matching pattern', () => {
    assert.throws(() => validateStringParam('invalid!@#', 'subreddit', 50, /^[a-zA-Z0-9_]+$/), { message: /subreddit contains invalid characters/ });
  });

  it('accepts valid strings', () => {
    assert.strictEqual(validateStringParam('worldnews', 'subreddit', 50, /^[a-zA-Z0-9_]+$/), 'worldnews');
  });

  it('trims whitespace', () => {
    assert.strictEqual(validateStringParam('  test  ', 'field'), 'test');
  });
});

describe('validateHexParam', () => {
  it('validates 6-char ICAO24 hex codes', () => {
    assert.strictEqual(validateHexParam('a1b2c3', 'icao24'), 'a1b2c3');
    assert.strictEqual(validateHexParam('ABCDEF', 'icao24'), 'abcdef');
  });

  it('rejects non-hex strings', () => {
    assert.throws(() => validateHexParam('zzzzzz', 'icao24'), { message: /icao24 must be a valid hex string/ });
  });

  it('rejects wrong length', () => {
    assert.throws(() => validateHexParam('abc', 'icao24'));
  });
});

describe('validateNumberParam', () => {
  it('validates numbers within range', () => {
    assert.strictEqual(validateNumberParam(50, 'limit', 1, 100), 50);
  });

  it('clamps to range boundaries', () => {
    assert.strictEqual(validateNumberParam(200, 'limit', 1, 100, true), 100);
    assert.strictEqual(validateNumberParam(-5, 'limit', 1, 100, true), 1);
  });

  it('rejects numbers outside range when clamp=false', () => {
    assert.throws(() => validateNumberParam(200, 'limit', 1, 100), { message: /limit must be between 1 and 100/ });
  });

  it('returns default for null/undefined', () => {
    assert.strictEqual(validateNumberParam(undefined as any, 'limit', 1, 100, false, 25), 25);
  });
});

describe('sanitizeTextContent', () => {
  it('strips HTML tags', () => {
    assert.strictEqual(sanitizeTextContent('<b>hello</b> <script>alert(1)</script>'), 'hello');
  });

  it('limits length', () => {
    assert.strictEqual(sanitizeTextContent('a'.repeat(3000), 100).length, 100);
  });

  it('normalizes whitespace', () => {
    assert.strictEqual(sanitizeTextContent('hello   world\n\ntest'), 'hello world test');
  });
});

describe('sanitizeUrl', () => {
  it('accepts http/https URLs', () => {
    assert.strictEqual(sanitizeUrl('https://example.com/path'), 'https://example.com/path');
  });

  it('rejects javascript: URLs', () => {
    assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '');
  });

  it('rejects data: URLs', () => {
    assert.strictEqual(sanitizeUrl('data:text/html,<h1>hi</h1>'), '');
  });

  it('returns empty for invalid URLs', () => {
    assert.strictEqual(sanitizeUrl('not-a-url'), '');
  });
});
```

**Step 2: Create the implementation**

```typescript
// src/utils/validation.ts

/**
 * Validate and sanitize a string parameter.
 * Throws on invalid input for use in server handlers.
 */
export function validateStringParam(
  value: unknown,
  paramName: string,
  maxLength = 1000,
  pattern?: RegExp,
): string {
  if (value === null || value === undefined) {
    throw new Error(`${paramName} is required`);
  }
  const str = String(value).trim();
  if (str.length === 0) {
    throw new Error(`${paramName} is required`);
  }
  if (str.length > maxLength) {
    throw new Error(`${paramName} exceeds maximum length of ${maxLength}`);
  }
  if (pattern && !pattern.test(str)) {
    throw new Error(`${paramName} contains invalid characters`);
  }
  return str;
}

/**
 * Validate a hex string parameter (e.g., ICAO24 transponder codes).
 */
export function validateHexParam(
  value: unknown,
  paramName: string,
  expectedLength = 6,
): string {
  const str = validateStringParam(value, paramName, expectedLength);
  const hex = str.toLowerCase();
  if (!/^[0-9a-f]+$/.test(hex) || hex.length !== expectedLength) {
    throw new Error(`${paramName} must be a valid hex string of length ${expectedLength}`);
  }
  return hex;
}

/**
 * Validate a numeric parameter within bounds.
 * @param clamp If true, clamp to range instead of throwing. Default false.
 * @param defaultValue Return this if value is null/undefined.
 */
export function validateNumberParam(
  value: unknown,
  paramName: string,
  min: number,
  max: number,
  clamp = false,
  defaultValue?: number,
): number {
  if (value === null || value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`${paramName} is required`);
  }
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`${paramName} must be a valid number`);
  }
  if (clamp) {
    return Math.min(Math.max(Math.round(num), min), max);
  }
  if (num < min || num > max) {
    throw new Error(`${paramName} must be between ${min} and ${max}`);
  }
  return Math.round(num);
}

// Common patterns
export const SUBREDDIT_PATTERN = /^[a-zA-Z0-9_]{2,21}$/;
export const TWITTER_HANDLE_PATTERN = /^[a-zA-Z0-9_]{1,15}$/;
export const SLUG_PATTERN = /^[a-zA-Z0-9._-]+$/;

/**
 * Sanitize text content for safe rendering.
 * Strips HTML tags, limits length, normalizes whitespace.
 */
export function sanitizeTextContent(text: string, maxLength = 2000): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a URL for safe rendering. Returns empty string if invalid.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}
```

**Step 3: Run tests, then commit**

```bash
npx tsx --test src/utils/validation.test.mts
git add src/utils/validation.ts src/utils/validation.test.mts
git commit -m "feat(infra): add input validation utility with tests"
```

---

### Task 0.2: AI Response Extraction Utility

**Files:**
- Create: `src/utils/ai-response.ts`
- Create: `src/utils/ai-response.test.mts`

**Step 1: Write tests**

```typescript
// src/utils/ai-response.test.mts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, validateDimensionScores } from './ai-response';

describe('extractJson', () => {
  it('parses plain JSON', () => {
    const result = extractJson<{ a: number }>('{"a": 1}');
    assert.strictEqual(result.a, 1);
  });

  it('extracts JSON from markdown code fences', () => {
    const result = extractJson<{ a: number }>('```json\n{"a": 1}\n```');
    assert.strictEqual(result.a, 1);
  });

  it('extracts JSON from triple backticks without language', () => {
    const result = extractJson<{ a: number }>('Here is the result:\n```\n{"a": 1}\n```\nDone.');
    assert.strictEqual(result.a, 1);
  });

  it('throws on non-JSON text', () => {
    assert.throws(() => extractJson('This is not JSON'));
  });

  it('handles nested objects', () => {
    const result = extractJson<{ d: { name: string }[] }>('{"d":[{"name":"test"}]}');
    assert.strictEqual(result.d[0].name, 'test');
  });
});

describe('validateDimensionScores', () => {
  it('clamps scores to 0-1 range', () => {
    const dims = [{ name: 'test', score: 1.5, weight: 0.2, reasoning: '' }];
    const result = validateDimensionScores(dims);
    assert.strictEqual(result[0].score, 1.0);
  });

  it('normalizes weights to sum to 1', () => {
    const dims = [
      { name: 'a', score: 0.5, weight: 0.5, reasoning: '' },
      { name: 'b', score: 0.5, weight: 0.5, reasoning: '' },
    ];
    const result = validateDimensionScores(dims);
    const sum = result.reduce((s, d) => s + d.weight, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.01);
  });
});
```

**Step 2: Create implementation**

```typescript
// src/utils/ai-response.ts

/**
 * Extract and parse JSON from an AI model response.
 * Handles: plain JSON, markdown code fences, surrounding text.
 */
export function extractJson<T>(text: string): T {
  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch { /* continue to extraction */ }

  // Try extracting from markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch { /* continue */ }
  }

  // Try finding JSON object/array in text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch { /* fall through */ }
  }

  throw new Error('Failed to extract JSON from AI response');
}

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  reasoning: string;
}

/**
 * Validate and normalize JP 3-60 dimension scores.
 * Clamps scores to [0, 1] and normalizes weights to sum to 1.0.
 */
export function validateDimensionScores(dimensions: DimensionScore[]): DimensionScore[] {
  const clamped = dimensions.map(d => ({
    ...d,
    score: Math.max(0, Math.min(1, Number(d.score) || 0)),
    weight: Math.max(0, Number(d.weight) || 0),
  }));

  const weightSum = clamped.reduce((s, d) => s + d.weight, 0);
  if (weightSum > 0 && Math.abs(weightSum - 1.0) > 0.01) {
    return clamped.map(d => ({ ...d, weight: d.weight / weightSum }));
  }

  return clamped;
}
```

**Step 3: Commit**

**Note:** For any HTML sanitization of AI responses in the frontend, use the existing `dompurify` package (already in `package.json`) instead of custom regex-based sanitizers. Example: `import DOMPurify from 'dompurify'; const clean = DOMPurify.sanitize(html);`

```bash
npx tsx --test src/utils/ai-response.test.mts
git add src/utils/ai-response.ts src/utils/ai-response.test.mts
git commit -m "feat(infra): add AI response JSON extraction and validation utility"
```

---

### Task 0.3: Error Display Wrapper Utility

The codebase uses `.ts` files with a `Panel` base class and a `h()` DOM helper from `@/utils/dom-utils.ts`. There is NO JSX and no Preact component rendering. The `tsconfig.json` has no JSX config. Therefore, this is a vanilla DOM try/catch error display wrapper, not a Preact error boundary.

**Files:**
- Create: `src/components/sentinel/error-display.ts`

**Step 1: Create error-display.ts**

```typescript
// src/components/sentinel/error-display.ts

/**
 * Error display wrapper for Sentinel panels.
 * Clears container and builds error UI with safe DOM methods (no innerHTML).
 * Uses vanilla DOM (no JSX/Preact) -- matches the codebase Panel class pattern.
 *
 * Usage:
 *   try { renderPanel(...) } catch (err) { createErrorDisplay('SocialFeed', container, err); }
 */
export function createErrorDisplay(moduleName: string, container: HTMLElement, error: Error): void {
  while (container.firstChild) container.removeChild(container.firstChild);

  const wrapper = document.createElement('div');
  wrapper.className = 'sentinel-error-panel';
  wrapper.setAttribute('role', 'alert');
  wrapper.style.cssText = 'padding:16px;text-align:center;';

  const title = document.createElement('strong');
  title.textContent = moduleName;
  wrapper.appendChild(title);

  const msg = document.createTextNode(': temporarily unavailable');
  wrapper.appendChild(msg);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Retry';
  btn.style.cssText = 'margin-top:8px;display:block;margin-left:auto;margin-right:auto;';
  btn.onclick = () => container.dispatchEvent(new CustomEvent('sentinel:retry'));
  wrapper.appendChild(btn);

  const details = document.createElement('details');
  details.style.cssText = 'margin-top:8px;font-size:0.85em;opacity:0.7;';
  const summary = document.createElement('summary');
  summary.textContent = 'Error details';
  details.appendChild(summary);
  const pre = document.createElement('pre');
  pre.style.cssText = 'white-space:pre-wrap;word-break:break-all;';
  pre.textContent = error.message;
  details.appendChild(pre);
  wrapper.appendChild(details);

  container.appendChild(wrapper);
  console.error(`[${moduleName}] Panel error:`, error);
}
```

**Step 2: Commit**

```bash
git add src/components/sentinel/error-display.ts
git commit -m "feat(infra): add error display wrapper utility for Sentinel panels"
```

---

### Task 0.4: DataFreshnessIndicator Component

**Files:**
- Create: `src/components/sentinel/DataFreshnessIndicator.ts`

**Step 1: Create component** (plain DOM function, no JSX/Preact)

```typescript
// src/components/sentinel/DataFreshnessIndicator.ts

export type FreshnessStatus = 'live' | 'cached' | 'stale' | 'unavailable' | 'loading';

const COLORS: Record<FreshnessStatus, string> = {
  live: '#22c55e',
  cached: '#eab308',
  stale: '#f97316',
  unavailable: '#ef4444',
  loading: '#6b7280',
};

function formatAge(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 0) return 'now';
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Create a data freshness indicator DOM element.
 * Uses vanilla DOM (no JSX/Preact) -- matches the codebase pattern.
 */
export function createDataFreshnessIndicator(status: FreshnessStatus, lastUpdated?: string | null): HTMLSpanElement {
  const span = document.createElement('span');
  span.setAttribute('role', 'status');
  span.setAttribute('aria-label', `Data status: ${status}`);
  span.title = lastUpdated ? `Last updated: ${formatAge(lastUpdated)}` : status;
  span.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:0.75em;opacity:0.8;';

  const dot = document.createElement('span');
  dot.style.cssText = `width:6px;height:6px;border-radius:50%;background-color:${COLORS[status]};display:inline-block;`;
  span.appendChild(dot);

  const label = lastUpdated && status !== 'loading' ? `${status} (${formatAge(lastUpdated)})` : status;
  span.appendChild(document.createTextNode(label));

  return span;
}
```

**Step 2: Commit**

```bash
git add src/components/sentinel/DataFreshnessIndicator.ts
git commit -m "feat(infra): add DataFreshnessIndicator component"
```

---

### Task 0.5: Server-side Killswitch Utility

**Files:**
- Create: `server/_shared/killswitch.ts`

**Step 1: Create killswitch.ts**

```typescript
/**
 * Server-side killswitch for Sentinel modules.
 * Usage in edge functions:
 *   const disabled = checkKillswitch('CLAUDE');
 *   if (disabled) return disabled;
 */
export function checkKillswitch(
  moduleName: string,
  corsHeaders?: Record<string, string>,
): Response | null {
  const envKey = `MODULE_${moduleName.toUpperCase()}_ENABLED`;
  const value = process.env[envKey];
  if (value === undefined || value === '' || value === 'true' || value === '1') {
    return null; // Module is enabled
  }
  return new Response(
    JSON.stringify({ error: `Module ${moduleName} is disabled`, status: 'disabled' }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '300', ...(corsHeaders ?? {}) },
    },
  );
}
```

**Step 2: Commit**

```bash
git add server/_shared/killswitch.ts
git commit -m "feat(infra): add server-side killswitch utility"
```

---

### Task 0.6: Sentinel Config Extraction (Feature Flags + Panels)

**Files:**
- Create: `src/config/sentinel-features.ts`
- Create: `src/config/sentinel-panels.ts`
- Create: `server/sentinel-cache-tiers.ts`
- Modify: `src/services/runtime-config.ts` (MINIMAL: 2 import lines + 2 spread lines)
- Modify: `src/config/panels.ts` (MINIMAL: 1 import line + 1 spread line)
- Modify: `server/gateway.ts` (MINIMAL: 1 import line + 1 spread line)

**Step 1: Create sentinel-features.ts**

> **IMPORTANT:** `RuntimeFeatureId` is a closed union type in `src/services/runtime-config.ts`. The sentinel feature IDs MUST be added directly to that union in the core file (see Step 4 below). The `SentinelFeatureId` type here is for documentation/reference only -- the actual type union lives in `runtime-config.ts`. Similarly, `RuntimeSecretKey` must be edited in the core file. Add `// SENTINEL:` comment markers around all additions.

```typescript
// src/config/sentinel-features.ts
// Sentinel-specific feature flag definitions and default toggles.
// The RuntimeFeatureId union itself MUST be edited in runtime-config.ts (see Step 4).
// This file holds the RUNTIME_FEATURES entries and default toggle values.
import type { RuntimeFeatureDefinition } from '../services/runtime-config';

// After adding sentinel IDs to RuntimeFeatureId union in runtime-config.ts (Step 4),
// these will type-check without 'as any' casts.
export const SENTINEL_FEATURES: RuntimeFeatureDefinition[] = [
  { id: 'aiClaude', name: 'Claude AI', description: 'Anthropic Claude for summarization (Haiku) and analysis (Sonnet).', requiredSecrets: ['CLAUDE_API_KEY'], fallback: 'Falls back to OpenRouter, then existing chain.' },
  { id: 'socialReddit', name: 'Reddit Feed', description: 'OSINT subreddit monitoring via OAuth2.', requiredSecrets: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'], fallback: 'Disabled' },
  { id: 'socialTwitter', name: 'X/Twitter Feed', description: 'OSINT account monitoring via TwitterAPI.io.', requiredSecrets: ['TWITTER_API_IO_KEY'], fallback: 'Disabled' },
  { id: 'socialBluesky', name: 'Bluesky Feed', description: 'Bluesky OSINT search via AT Protocol (no auth).', requiredSecrets: [], fallback: 'Disabled' },
  { id: 'socialYouTube', name: 'YouTube Feed', description: 'YouTube Data API keyword search + channel monitoring.', requiredSecrets: ['YOUTUBE_API_KEY'], fallback: 'Disabled' },
  { id: 'socialTikTok', name: 'TikTok Feed', description: 'TikTok via Apify scraper on Railway.', requiredSecrets: ['TIKTOK_APIFY_TOKEN'], fallback: 'Disabled' },
  { id: 'socialVK', name: 'VK Feed', description: 'VKontakte military groups via VK API v5.', requiredSecrets: ['VK_SERVICE_TOKEN'], fallback: 'Disabled' },
  { id: 'govdataNotam', name: 'FAA NOTAM', description: 'NOTAMs and TFRs for pre-strike detection.', requiredSecrets: ['FAA_API_KEY'], fallback: 'Disabled' },
  { id: 'trajectoryFlight', name: 'Flight History', description: 'Historical flight tracks from OpenSky.', requiredSecrets: [], fallback: 'Disabled' },
  { id: 'predictionKalshi', name: 'Kalshi Markets', description: 'US-regulated prediction market data.', requiredSecrets: [], fallback: 'Shows only Polymarket' },
  { id: 'predictionMetaculus', name: 'Metaculus Forecasts', description: 'Community forecasting data.', requiredSecrets: [], fallback: 'Shows only Polymarket' },
];

export const SENTINEL_DEFAULT_TOGGLES: Record<string, boolean> = {
  aiClaude: true, socialReddit: true, socialTwitter: true, socialBluesky: true,
  socialYouTube: true, socialTikTok: false, socialVK: false,
  govdataNotam: true, trajectoryFlight: true, predictionKalshi: true, predictionMetaculus: true,
};
```

**Step 2: Create sentinel-panels.ts**

```typescript
// src/config/sentinel-panels.ts
import type { PanelConfig } from '@/types';

export const SENTINEL_PANELS: Record<string, PanelConfig> = {
  'social-feed': { name: 'Social Intelligence', enabled: true, priority: 2 },
  analyst: { name: 'JP 3-60 Analyst', enabled: true, priority: 1 },
  'notam-tfr': { name: 'NOTAM / TFR', enabled: true, priority: 2 },
  'flight-history': { name: 'Flight History', enabled: true, priority: 2 },
};
```

**Step 3: Create sentinel-cache-tiers.ts**

```typescript
// server/sentinel-cache-tiers.ts
// Sentinel-specific cache tier overrides. Imported into gateway.ts.

export const SENTINEL_CACHE_TIERS: Record<string, string> = {
  '/api/claude/v1/summarize': 'medium',    // 15min cache
  '/api/claude/v1/analyze': 'slow',        // 30min cache
  '/api/claude/v1/predict': 'slow',        // 30min cache
  '/api/social/v1/list-reddit-posts': 'medium',
  '/api/social/v1/list-tweets': 'fast',
  '/api/social/v1/list-bluesky-posts': 'fast',
  '/api/social/v1/list-youtube-videos': 'medium',
  '/api/social/v1/list-tiktok-posts': 'slow',
  '/api/social/v1/list-vk-posts': 'medium',
  '/api/govdata/v1/list-notams': 'medium',
  '/api/trajectory/v1/query-flight-history': 'slow',
  '/api/analyst/v1/run-assessment': 'slow',
  '/api/analyst/v1/get-prediction': 'slow',
  '/api/prediction/v1/list-kalshi-markets': 'medium',
  '/api/prediction/v1/list-metaculus-questions': 'medium',
};
```

**Step 4: Modify runtime-config.ts (MINIMAL but REQUIRED core file edit)**

> **Why this is a core file edit:** `RuntimeFeatureId` is a closed string union type. TypeScript does not allow extending unions from external files via declaration merging. You MUST add the new IDs directly to the union. Use `// SENTINEL:` markers around all additions.

Add import at the top (after existing imports):

```typescript
// SENTINEL: import Sentinel feature definitions
import { SENTINEL_FEATURES, SENTINEL_DEFAULT_TOGGLES } from '../config/sentinel-features';
```

Add to the `RuntimeSecretKey` union -- append at end before the closing semicolon:

```typescript
  // SENTINEL: Sentinel secret keys
  | 'CLAUDE_API_KEY'
  | 'REDDIT_CLIENT_ID'
  | 'REDDIT_CLIENT_SECRET'
  | 'TWITTER_API_IO_KEY'
  | 'TWITTER_BEARER_TOKEN'
  | 'YOUTUBE_API_KEY'
  | 'FAA_API_KEY'
  | 'TIKTOK_APIFY_TOKEN'
  | 'VK_SERVICE_TOKEN';  // SENTINEL: end
```

Add to the `RuntimeFeatureId` union -- append at end before the closing semicolon:

```typescript
  // SENTINEL: Sentinel feature IDs
  | 'aiClaude'
  | 'socialReddit'
  | 'socialTwitter'
  | 'socialBluesky'
  | 'socialYouTube'
  | 'socialTikTok'
  | 'socialVK'
  | 'govdataNotam'
  | 'trajectoryFlight'
  | 'predictionKalshi'
  | 'predictionMetaculus';  // SENTINEL: end
```

In `defaultToggles`, add after last entry:

```typescript
  ...SENTINEL_DEFAULT_TOGGLES,  // SENTINEL
```

In `RUNTIME_FEATURES` array, add at end:

```typescript
  ...SENTINEL_FEATURES,  // SENTINEL
```

**Step 5: Modify panels.ts (MINIMAL)**

Add import at top:

```typescript
// SENTINEL: import Sentinel panel registrations
import { SENTINEL_PANELS } from './sentinel-panels';
```

Add spread at end of `FULL_PANELS`:

```typescript
  ...SENTINEL_PANELS,  // SENTINEL
```

**Step 6: Modify gateway.ts (MINIMAL)**

Add import at top:

```typescript
// SENTINEL: import Sentinel cache tier overrides
import { SENTINEL_CACHE_TIERS } from './sentinel-cache-tiers';
```

In `RPC_CACHE_TIER`, spread at end:

```typescript
  ...SENTINEL_CACHE_TIERS,  // SENTINEL
```

**Step 7: Commit**

```bash
git add src/config/sentinel-features.ts src/config/sentinel-panels.ts server/sentinel-cache-tiers.ts \
  src/services/runtime-config.ts src/config/panels.ts server/gateway.ts
git commit -m "feat(infra): extract Sentinel config to separate files with minimal upstream changes"
```

---

### Task 0.7: Update .env.example, create .nvmrc, add generate script

**Files:**
- Modify: `.env.example` (append Sentinel section -- file already exists with ~170 lines)
- Create: `.nvmrc`
- Modify: `package.json` (add `generate` script)

**Step 1: Append to existing .env.example** (do NOT create a new file -- it already exists)

Add the following block at the end of the existing `.env.example`:

```bash

# === SENTINEL ===
# ============================================
# Omni Sentinel -- Extended Features
# ============================================

# ------ Claude AI (Primary AI Provider) ------
CLAUDE_API_KEY=

# ------ Reddit OAuth2 ------
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# ------ Twitter/X (via TwitterAPI.io) ------
TWITTER_API_IO_KEY=

# ------ Twitter/X (Official API -- optional) ------
TWITTER_BEARER_TOKEN=

# ------ YouTube Data API v3 ------
YOUTUBE_API_KEY=

# ------ FAA NOTAM API ------
FAA_API_KEY=

# ------ TikTok (via Apify) ------
TIKTOK_APIFY_TOKEN=

# ------ VK API ------
VK_SERVICE_TOKEN=

# ------ Module Killswitches (set to 'false' to disable) ------
# MODULE_CLAUDE_ENABLED=true
# MODULE_SOCIAL_ENABLED=true
# MODULE_ANALYST_ENABLED=true
# MODULE_GOVDATA_ENABLED=true
# MODULE_TRAJECTORY_ENABLED=true

# ------ Claude Budget Controls ------
# CLAUDE_DAILY_BUDGET_USD=25
```

**Step 2: Create .nvmrc**

```
20
```

**Step 3: Add generate script to package.json scripts**

```json
"generate": "cd proto && buf generate"
```

**Step 4: Commit**

```bash
git add .env.example .nvmrc package.json
git commit -m "feat(infra): add .env.example Sentinel vars, .nvmrc, generate script"
```

---

### Task 0.8: Create LEGAL.md

**Files:**
- Create: `LEGAL.md`

Create a file documenting the ToS status of each data source (see master checklist P3-16). Include Reddit AI risk, VK data law risk, AGPL implications, and ethical disclaimer text.

**Step 1: Commit**

```bash
git add LEGAL.md
git commit -m "docs: add LEGAL.md documenting data source ToS compliance"
```

---

### Task 0.9: Create .gitattributes (P0 -- prevents merge conflicts in generated/lock files)

**Files:**
- Create: `.gitattributes`

**Step 1: Create .gitattributes** with merge strategies for generated code and lock files:

```gitattributes
# Auto-generated proto code -- always accept ours on conflict (regenerate after merge)
src/generated/** merge=ours

# Lock files -- use built-in merge strategy
pnpm-lock.yaml merge=binary
package-lock.json merge=binary

# Large JSON locale files -- keep ours (sentinel-en.json is separate)
src/locales/en.json merge=ours

# Binary assets
*.png binary
*.jpg binary
*.ico binary
```

**Step 2: Commit**

```bash
git add .gitattributes
git commit -m "feat(infra): add .gitattributes with merge strategies for generated code and lock files"
```

---

### Task 0.10: Pre-create ALL Sentinel Feature Flags and Placeholders

**Goal:** Module 0 should pre-create ALL sentinel feature IDs, panel registrations, and gateway cache entries (even as placeholders) so that parallel modules (1-7) don't all try to edit the same shared files (`runtime-config.ts`, `panels.ts`, `gateway.ts`). This prevents merge conflicts when modules are developed in parallel worktrees.

**What to include:**
- ALL `RuntimeFeatureId` entries for every module (already done in Task 0.6 Step 4)
- ALL `SENTINEL_PANELS` entries (already done in Task 0.6 Step 2)
- ALL `SENTINEL_CACHE_TIERS` entries (already done in Task 0.6 Step 3)
- ALL `SENTINEL_DEFAULT_TOGGLES` entries (already done in Task 0.6 Step 1)
- The i18n file `src/locales/sentinel-en.json` with placeholder keys for ALL modules (see Task 0.11)

This means Tasks 0.6 and 0.11 must include complete entries for every module -- not just the ones being worked on immediately. Feature modules should only need to fill in their implementation files, NOT edit shared config.

---

### Task 0.11: Create sentinel-en.json for i18n (avoid editing en.json)

**Files:**
- Create: `src/locales/sentinel-en.json`
- Modify: i18n initialization code to load sentinel bundle

**Step 1:** Instead of editing `src/locales/en.json` directly (which is a 2300-line upstream file that causes merge conflicts), create a separate `src/locales/sentinel-en.json` with all sentinel i18n keys:

```json
{
  "sentinel": {
    "claude": {
      "title": "Claude AI",
      "summarizing": "Generating summary...",
      "analyzing": "Running analysis...",
      "error": "Claude AI is not available. Check your API key in settings.",
      "budgetExceeded": "Daily Claude budget exceeded. Try again tomorrow.",
      "cached": "Using cached result"
    },
    "socialFeed": {
      "title": "Social Intelligence",
      "filterAll": "All",
      "filterReddit": "Reddit",
      "filterTwitter": "X",
      "filterBluesky": "Bluesky",
      "filterYouTube": "YouTube",
      "filterTikTok": "TikTok",
      "filterVK": "VK",
      "loading": "Loading social feeds...",
      "empty": "No posts available",
      "error": "Failed to load social feed",
      "disabled": "Social feed is not configured"
    },
    "analyst": {
      "title": "JP 3-60 Analysis",
      "placeholder": "Enter analysis query (e.g., 'Middle East conflict trajectory next 7 days')",
      "analyze": "Run Analysis",
      "analyzing": "Analyzing...",
      "dimensions": "Dimension Scores",
      "probability": "Overall Probability",
      "confidence": "Confidence",
      "timeframe": "Timeframe",
      "noResults": "Enter a query to begin analysis",
      "error": "Analysis failed. Check your Claude API key in settings.",
      "disclaimer": "AI-generated estimate. Do not use as sole basis for decisions."
    },
    "govdata": {
      "title": "NOTAM / TFR",
      "loading": "Loading NOTAMs...",
      "error": "Failed to load NOTAMs",
      "empty": "No active NOTAMs in this region"
    },
    "trajectory": {
      "title": "Flight History",
      "loading": "Loading flight history...",
      "error": "Failed to load flight history",
      "empty": "No trajectory data available"
    },
    "prediction": {
      "kalshi": "Kalshi Markets",
      "metaculus": "Metaculus Forecasts",
      "loading": "Loading predictions...",
      "error": "Failed to load prediction data"
    }
  }
}
```

**Step 2:** Load the sentinel bundle at app initialization using i18next's `addResourceBundle`:

```typescript
// In app initialization (e.g., src/app.ts or wherever i18n is configured)
import sentinelEn from '@/locales/sentinel-en.json';

// After i18next is initialized:
i18next.addResourceBundle('en', 'translation', sentinelEn, true, true);
```

**Step 3: Commit**

```bash
git add src/locales/sentinel-en.json
git commit -m "feat(infra): add sentinel-en.json i18n bundle (avoids editing upstream en.json)"
```

---

## Module 1: Claude AI Provider

**Goal:** Claude as primary AI provider with Haiku 4.5 for summarization, Sonnet 4 for analysis. Rate limiting, spend tracking, and 15s timeout with OpenRouter fallback.

### Task 1.1: Proto Definitions

**Files:**
- Create: `proto/worldmonitor/claude/v1/service.proto`
- Create: `proto/worldmonitor/claude/v1/summarize.proto`
- Create: `proto/worldmonitor/claude/v1/analyze.proto`
- Create: `proto/worldmonitor/claude/v1/predict.proto`

**Step 1: Read existing proto files** in `proto/worldmonitor/` to copy the sebuf annotation pattern.

**Step 2: Create service.proto**

```protobuf
syntax = "proto3";
package worldmonitor.claude.v1;

import "sebuf/http/annotations.proto";
import "worldmonitor/claude/v1/summarize.proto";
import "worldmonitor/claude/v1/analyze.proto";
import "worldmonitor/claude/v1/predict.proto";

service ClaudeService {
  option (sebuf.http.service_config) = {base_path: "/api/claude/v1"};

  rpc Summarize(SummarizeRequest) returns (SummarizeResponse) {
    option (sebuf.http.config) = {path: "/summarize", method: HTTP_METHOD_POST};
  }

  rpc Analyze(AnalyzeRequest) returns (AnalyzeResponse) {
    option (sebuf.http.config) = {path: "/analyze", method: HTTP_METHOD_POST};
  }

  rpc Predict(PredictRequest) returns (PredictResponse) {
    option (sebuf.http.config) = {path: "/predict", method: HTTP_METHOD_POST};
  }
}
```

**Step 3: Create summarize.proto**

```protobuf
syntax = "proto3";
package worldmonitor.claude.v1;

message SummarizeRequest {
  repeated string headlines = 1;
  string region = 2;
  string language = 3;
  string variant = 4;
}

message SummarizeResponse {
  string summary = 1;
  repeated string key_points = 2;
  string sentiment = 3;
  string provider = 4;     // "claude" | "openrouter"
  string status = 5;       // "ok" | "error" | "cached"
  string error_message = 6;
  int32 input_tokens = 7;
  int32 output_tokens = 8;
}
```

**Step 4: Create analyze.proto**

```protobuf
syntax = "proto3";
package worldmonitor.claude.v1;

message AnalyzeRequest {
  string query = 1;
  repeated string context_data = 2;
  string region = 3;
}

message AnalyzeResponse {
  string analysis = 1;
  repeated string key_findings = 2;
  string risk_level = 3;
  string status = 4;
  string error_message = 5;
  int32 input_tokens = 6;
  int32 output_tokens = 7;
}
```

**Step 5: Create predict.proto**

```protobuf
syntax = "proto3";
package worldmonitor.claude.v1;

message PredictRequest {
  string scenario = 1;
  repeated string evidence = 2;
  string timeframe = 3;
}

message DimensionScore {
  string name = 1;
  double score = 2;
  double weight = 3;
  string reasoning = 4;
}

message PredictResponse {
  repeated DimensionScore dimensions = 1;
  double overall_probability = 2;
  string confidence = 3;
  string timeframe = 4;
  string narrative = 5;
  string status = 6;
  string error_message = 7;
  int32 input_tokens = 8;
  int32 output_tokens = 9;
}
```

**Step 6: Run buf generate**

```bash
npm run generate
```

**Step 7: Commit**

```bash
git add proto/worldmonitor/claude/ src/generated/
git commit -m "feat(claude): add proto definitions for Claude AI service"
```

---

### Task 1.2: Summarize Handler (Haiku)

**Files:**
- Create: `server/worldmonitor/claude/v1/summarize.ts`
- Create: `server/worldmonitor/claude/v1/summarize.test.mts`

**Step 1: Write test**

```typescript
// server/worldmonitor/claude/v1/summarize.test.mts
import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { handleSummarize } from './summarize';

describe('handleSummarize', () => {
  let mockFetch: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    mockFetch = mock.fn(() => Promise.resolve({
      ok: false, status: 500, json: () => Promise.resolve({}),
    }));
    global.fetch = mockFetch as any;
    process.env.CLAUDE_API_KEY = 'test-key';
  });

  it('returns summary from Claude API using Haiku model', async () => {
    mockFetch.mock.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        content: [{ type: 'text', text: '{"summary":"Test summary","key_points":["p1"],"sentiment":"neutral"}' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    }));
    const result = await handleSummarize({ headlines: ['H1', 'H2'], region: '', language: 'en', variant: '' });
    assert.strictEqual(result.summary, 'Test summary');
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.inputTokens, 100);
    // Verify Haiku model used
    const body = JSON.parse(mockFetch.mock.calls[0].arguments[1].body);
    assert.ok(body.model.includes('haiku'));
  });

  it('returns error status when API key missing', async () => {
    delete process.env.CLAUDE_API_KEY;
    const result = await handleSummarize({ headlines: ['test'], region: '', language: 'en', variant: '' });
    assert.strictEqual(result.status, 'error');
    assert.ok(result.errorMessage);
  });

  it('returns error status on API failure', async () => {
    mockFetch.mock.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 500 }));
    const result = await handleSummarize({ headlines: ['test'], region: '', language: 'en', variant: '' });
    assert.strictEqual(result.status, 'error');
  });
});
```

**Step 2: Implement handler**

```typescript
// server/worldmonitor/claude/v1/summarize.ts
import { extractJson } from '../../../../src/utils/ai-response';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

interface SummarizeInput { headlines: string[]; region: string; language: string; variant: string; }
interface SummarizeOutput {
  summary: string; keyPoints: string[]; sentiment: string; provider: string;
  status: string; errorMessage: string; inputTokens: number; outputTokens: number;
}

const ERROR_RESULT: SummarizeOutput = {
  summary: '', keyPoints: [], sentiment: '', provider: 'claude',
  status: 'error', errorMessage: '', inputTokens: 0, outputTokens: 0,
};

export async function handleSummarize(input: SummarizeInput): Promise<SummarizeOutput> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return { ...ERROR_RESULT, errorMessage: 'Claude API key not configured' };

  const systemPrompt = `You are a concise news analyst. Summarize these headlines into a brief situational overview (2-3 paragraphs). Focus on geopolitical significance.${input.region ? ` Region focus: ${input.region}.` : ''} Language: ${input.language || 'en'}. Respond in JSON: {"summary":"...","key_points":["..."],"sentiment":"positive|negative|neutral|mixed"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: HAIKU_MODEL, max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: input.headlines.join('\n') }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return { ...ERROR_RESULT, errorMessage: `Claude API error: ${response.status}` };

    const data = await response.json() as any;
    const text = data.content?.[0]?.text ?? '';
    const parsed = extractJson<{ summary: string; key_points: string[]; sentiment: string }>(text);

    return {
      summary: parsed.summary ?? '', keyPoints: parsed.key_points ?? [], sentiment: parsed.sentiment ?? '',
      provider: 'claude', status: 'ok', errorMessage: '',
      inputTokens: data.usage?.input_tokens ?? 0, outputTokens: data.usage?.output_tokens ?? 0,
    };
  } catch (err) {
    return { ...ERROR_RESULT, errorMessage: err instanceof Error ? err.message : 'Unknown error' };
  }
}
```

**Step 3: Run tests, commit**

```bash
npx tsx --test server/worldmonitor/claude/v1/summarize.test.mts
git add server/worldmonitor/claude/v1/summarize.ts server/worldmonitor/claude/v1/summarize.test.mts
git commit -m "feat(claude): implement Summarize handler with Haiku model and 15s timeout"
```

---

### Task 1.3: Analyze Handler (Sonnet)

**Files:**
- Create: `server/worldmonitor/claude/v1/analyze.ts`
- Create: `server/worldmonitor/claude/v1/analyze.test.mts`

Follow same TDD pattern as Task 1.2. Key differences:
- Uses Sonnet model: `claude-sonnet-4-20250514`
- System prompt focuses on deep geopolitical analysis
- Returns `analysis`, `keyFindings`, `riskLevel`
- Higher `max_tokens`: 2048
- 15s timeout with AbortController

**Step 1: Write test** (mock Claude, verify Sonnet model + analysis fields)

**Step 2: Implement** (copy summarize.ts pattern, swap model + prompt)

**Step 3: Commit**

---

### Task 1.4: Predict Handler (JP 3-60 Six-Dimension Scoring)

**Files:**
- Create: `server/worldmonitor/claude/v1/predict.ts`
- Create: `server/worldmonitor/claude/v1/predict.test.mts`

Uses Sonnet model with JP 3-60 system prompt. Returns `DimensionScore[]` + `overallProbability`. Must validate scores are 0.0-1.0 using `validateDimensionScores()` from `src/utils/ai-response.ts`. System prompt:

```
You are a military intelligence analyst using the JP 3-60 Joint Targeting framework.
Score the scenario on 6 dimensions (0.0-1.0):
1. Military Readiness (20%) -- Force deployments, logistics, exercises
2. Political Will (25%) -- Leadership statements, domestic politics
3. Target Urgency (20%) -- Threat timelines, capability windows
4. Diplomatic Alternatives (15%) -- Negotiation status, sanctions
5. Allied Support (10%) -- Coalition readiness, basing agreements
6. Provocation Level (10%) -- Recent incidents, escalation patterns

Respond in JSON: {"dimensions":[{"name":"...","score":0.0-1.0,"weight":0.0-1.0,"reasoning":"..."}],"overall_probability":0.0-1.0,"confidence":"low|medium|high","timeframe":"...","narrative":"..."}
```

**Step 1-3: TDD cycle, commit**

---

### Task 1.5: Handler Registry + Edge Function

**Files:**
- Create: `server/worldmonitor/claude/v1/handler.ts`
- Create: `api/claude/v1/[rpc].ts`

**Step 1: Create handler.ts**

```typescript
import type { ClaudeServiceHandler } from '../../../../src/generated/server/worldmonitor/claude/v1/service_server';
import { handleSummarize } from './summarize';
import { handleAnalyze } from './analyze';
import { handlePredict } from './predict';

export const claudeHandler: ClaudeServiceHandler = {
  summarize: handleSummarize as any,
  analyze: handleAnalyze as any,
  predict: handlePredict as any,
};
```

**Step 2: Create Edge Function**

```typescript
// api/claude/v1/[rpc].ts
export const config = { runtime: 'edge' };

import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createClaudeServiceRoutes } from '../../../src/generated/server/worldmonitor/claude/v1/service_server';
import { claudeHandler } from '../../../server/worldmonitor/claude/v1/handler';
import { checkKillswitch } from '../../../server/_shared/killswitch';

const routes = createClaudeServiceRoutes(claudeHandler, serverOptions);
const gateway = createDomainGateway(routes);

export default async function handler(req: Request): Promise<Response> {
  const disabled = checkKillswitch('CLAUDE');
  if (disabled) return disabled;
  return gateway(req);
}
```

**Step 3: Commit**

```bash
git add server/worldmonitor/claude/v1/handler.ts api/claude/v1/
git commit -m "feat(claude): add handler registry and edge function with killswitch"
```

---

### Task 1.6: Client Wrapper + Circuit Breaker

**Files:**
- Create: `src/services/claude/index.ts`

**Step 1: Create client wrapper**

```typescript
// src/services/claude/index.ts
import { ClaudeServiceClient } from '../../generated/client/worldmonitor/claude/v1/service_client';
import { createCircuitBreaker } from '@/utils';
import type { SummarizeResponse, AnalyzeResponse, PredictResponse } from '../../generated/client/worldmonitor/claude/v1/service_client';

const client = new ClaudeServiceClient('', { fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args) });

const summarizeBreaker = createCircuitBreaker<SummarizeResponse>({ name: 'Claude Summarize', cacheTtlMs: 15 * 60 * 1000, persistCache: true });
const analyzeBreaker = createCircuitBreaker<AnalyzeResponse>({ name: 'Claude Analyze', cacheTtlMs: 30 * 60 * 1000, persistCache: true });
const predictBreaker = createCircuitBreaker<PredictResponse>({ name: 'Claude Predict', cacheTtlMs: 30 * 60 * 1000, persistCache: true });

const emptySum: SummarizeResponse = { summary: '', keyPoints: [], sentiment: '', provider: '', status: 'error', errorMessage: 'Circuit breaker open', inputTokens: 0, outputTokens: 0 };
const emptyAn: AnalyzeResponse = { analysis: '', keyFindings: [], riskLevel: '', status: 'error', errorMessage: 'Circuit breaker open', inputTokens: 0, outputTokens: 0 };
const emptyPred: PredictResponse = { dimensions: [], overallProbability: 0, confidence: 'low', timeframe: '', narrative: '', status: 'error', errorMessage: 'Circuit breaker open', inputTokens: 0, outputTokens: 0 };

export async function claudeSummarize(headlines: string[], region = '', lang = 'en', variant = ''): Promise<SummarizeResponse> {
  return summarizeBreaker.execute(() => client.summarize({ headlines, region, language: lang, variant }), emptySum);
}

export async function claudeAnalyze(query: string, contextData: string[], region = ''): Promise<AnalyzeResponse> {
  return analyzeBreaker.execute(() => client.analyze({ query, contextData, region }), emptyAn);
}

export async function claudePredict(scenario: string, evidence: string[], timeframe = '7d'): Promise<PredictResponse> {
  return predictBreaker.execute(() => client.predict({ scenario, evidence, timeframe }), emptyPred);
}
```

**Step 2: Commit**

```bash
git add src/services/claude/
git commit -m "feat(claude): add client wrapper with circuit breaker and cache TTLs"
```

---

### Task 1.7: Wire Claude into Summarization Fallback Chain

**Files:**
- Modify: `src/services/summarization.ts` (MINIMAL changes)

**Step 1: Add Claude to SummarizationProvider type**

Find the `SummarizationProvider` type and add `'claude'`:

```typescript
export type SummarizationProvider = 'claude' | 'ollama' | 'groq' | 'openrouter' | 'browser' | 'cache';
```

**Step 2: PREPEND Claude to API_PROVIDERS array (do NOT replace)**

```typescript
const API_PROVIDERS: ApiProviderDef[] = [
  { featureId: 'aiClaude',      provider: 'claude' as SummarizationProvider, label: 'Claude' },  // SENTINEL: prepended
  { featureId: 'aiOllama',      provider: 'ollama',     label: 'Ollama' },
  { featureId: 'aiGroq',        provider: 'groq',       label: 'Groq AI' },
  { featureId: 'aiOpenRouter',  provider: 'openrouter', label: 'OpenRouter' },
];
```

This preserves the full existing chain. Claude is tried first, then falls through to existing providers, then Browser T5 as final offline fallback.

**Step 3: Commit**

```bash
git add src/services/summarization.ts
git commit -m "feat(claude): prepend Claude to AI provider fallback chain (keep existing chain intact)"
```

---

### Task 1.8: Rate Limiting + Spend Tracking

**Files:**
- Create: `server/worldmonitor/claude/v1/spend-tracker.ts`

**Step 1: Create spend tracker**

```typescript
// server/worldmonitor/claude/v1/spend-tracker.ts

// Haiku pricing: $0.80/MTok input, $4/MTok output
// Sonnet pricing: $3/MTok input, $15/MTok output
const PRICING = {
  haiku:  { input: 0.80 / 1_000_000, output: 4.0 / 1_000_000 },
  sonnet: { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
};

interface UsageRecord { inputTokens: number; outputTokens: number; model: 'haiku' | 'sonnet'; costUsd: number; timestamp: number; }

// In-memory daily tracker (reset at midnight UTC)
let dailyRecords: UsageRecord[] = [];
let lastResetDate = '';

function resetIfNewDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastResetDate) { dailyRecords = []; lastResetDate = today; }
}

export function trackUsage(inputTokens: number, outputTokens: number, model: 'haiku' | 'sonnet'): void {
  resetIfNewDay();
  const pricing = PRICING[model];
  const costUsd = inputTokens * pricing.input + outputTokens * pricing.output;
  dailyRecords.push({ inputTokens, outputTokens, model, costUsd, timestamp: Date.now() });
  const totalToday = dailyRecords.reduce((s, r) => s + r.costUsd, 0);
  if (totalToday > 10) console.warn(`[Claude] Daily spend alert: $${totalToday.toFixed(2)} (>$10)`);
  if (totalToday > 25) console.warn(`[Claude] Daily spend WARNING: $${totalToday.toFixed(2)} (>$25)`);
  if (totalToday > 50) console.error(`[Claude] Daily spend CRITICAL: $${totalToday.toFixed(2)} (>$50)`);
}

export function getDailySpend(): number {
  resetIfNewDay();
  return dailyRecords.reduce((s, r) => s + r.costUsd, 0);
}

export function isBudgetExceeded(): boolean {
  const budgetStr = process.env.CLAUDE_DAILY_BUDGET_USD;
  const budget = budgetStr ? parseFloat(budgetStr) : 25;
  return getDailySpend() >= budget;
}
```

**Step 2: Wire spend tracking into handlers** -- call `trackUsage()` after each successful Claude API response.

**Step 3: Check `isBudgetExceeded()` in edge function before processing -- return 429 if exceeded.

**Step 4: Commit**

```bash
git add server/worldmonitor/claude/v1/spend-tracker.ts
git commit -m "feat(claude): add spend tracking with daily budget cap and alerts"
```

---

### Task 1.9: i18n Keys

**Files:**
- Modify: `src/locales/sentinel-en.json` (already created in Task 0.11 with placeholder keys)

Verify that the `sentinel.claude` section in `src/locales/sentinel-en.json` contains the correct keys:

```json
"claude": {
  "title": "Claude AI",
  "summarizing": "Generating summary...",
  "analyzing": "Running analysis...",
  "error": "Claude AI is not available. Check your API key in settings.",
  "budgetExceeded": "Daily Claude budget exceeded. Try again tomorrow.",
  "cached": "Using cached result"
}
```

**Note:** Do NOT edit `src/locales/en.json` directly -- it is a 2300-line upstream file. All sentinel i18n keys live in `src/locales/sentinel-en.json` and are loaded via `i18next.addResourceBundle()` at runtime (see Task 0.11).

**Step 1: Commit** (if keys needed updating from placeholders)

```bash
git add src/locales/sentinel-en.json
git commit -m "feat(claude): finalize i18n keys for Claude AI in sentinel-en.json"
```

---

## Module 2: Social Media Integration

**Goal:** Reddit (OAuth2), X/Twitter (adapter pattern), Bluesky (AT Protocol), YouTube (Data API), TikTok (Apify), VK (API v5) with unified SocialPost type and SocialFeedPanel frontend.

### Task 2.1: Proto Definitions

**Files:**
- Create: `proto/worldmonitor/social/v1/service.proto`
- Create: `proto/worldmonitor/social/v1/common.proto`
- Create: `proto/worldmonitor/social/v1/reddit.proto`
- Create: `proto/worldmonitor/social/v1/twitter.proto`
- Create: `proto/worldmonitor/social/v1/bluesky.proto`
- Create: `proto/worldmonitor/social/v1/youtube.proto`
- Create: `proto/worldmonitor/social/v1/tiktok.proto`
- Create: `proto/worldmonitor/social/v1/vk.proto`

**Step 1: Create common.proto**

```protobuf
syntax = "proto3";
package worldmonitor.social.v1;

message SocialPost {
  string id = 1;
  string platform = 2;
  string author = 3;
  string content = 4;         // sanitized text, never raw HTML
  string url = 5;
  int64 timestamp = 6;        // unix ms
  string media_url = 7;
  double latitude = 8;
  double longitude = 9;
  int32 engagement = 10;      // likes/upvotes/views
  string subreddit = 11;      // reddit-only
  string hashtags = 12;       // comma-separated
}

message SocialFeedResponse {
  repeated SocialPost posts = 1;
  int32 count = 2;
  string status = 3;          // "ok" | "error" | "disabled"
  string error_message = 4;
}
```

**Step 2: Create per-platform request protos** (reddit.proto, twitter.proto, bluesky.proto, youtube.proto, tiktok.proto, vk.proto). Each has a List*Request with platform-specific fields and returns SocialFeedResponse.

**Step 3: Create service.proto** with all RPCs (MUST include `sebuf.http` annotations):

```protobuf
syntax = "proto3";
package worldmonitor.social.v1;

import "sebuf/http/annotations.proto";
import "worldmonitor/social/v1/common.proto";
import "worldmonitor/social/v1/reddit.proto";
import "worldmonitor/social/v1/twitter.proto";
import "worldmonitor/social/v1/bluesky.proto";
import "worldmonitor/social/v1/youtube.proto";
import "worldmonitor/social/v1/tiktok.proto";
import "worldmonitor/social/v1/vk.proto";

service SocialService {
  option (sebuf.http.service_config) = {base_path: "/api/social/v1"};

  rpc ListRedditPosts(ListRedditPostsRequest) returns (SocialFeedResponse) {
    option (sebuf.http.config) = {path: "/list-reddit-posts", method: HTTP_METHOD_GET};
  }
  rpc ListTweets(ListTweetsRequest) returns (SocialFeedResponse) {
    option (sebuf.http.config) = {path: "/list-tweets", method: HTTP_METHOD_GET};
  }
  rpc ListBlueskyPosts(ListBlueskyPostsRequest) returns (SocialFeedResponse) {
    option (sebuf.http.config) = {path: "/list-bluesky-posts", method: HTTP_METHOD_GET};
  }
  rpc ListYouTubeVideos(ListYouTubeVideosRequest) returns (SocialFeedResponse) {
    option (sebuf.http.config) = {path: "/list-youtube-videos", method: HTTP_METHOD_GET};
  }
  rpc ListTikTokPosts(ListTikTokPostsRequest) returns (SocialFeedResponse) {
    option (sebuf.http.config) = {path: "/list-tiktok-posts", method: HTTP_METHOD_GET};
  }
  rpc ListVKPosts(ListVKPostsRequest) returns (SocialFeedResponse) {
    option (sebuf.http.config) = {path: "/list-vk-posts", method: HTTP_METHOD_GET};
  }
}
```

**Step 4: Run buf generate, commit**

---

### Task 2.2: Reddit Handler (OAuth2)

**Files:**
- Create: `server/worldmonitor/social/v1/reddit.ts`
- Create: `server/worldmonitor/social/v1/reddit.test.mts`

**Step 1: Write test** (mock OAuth2 token exchange + `/r/{sub}/hot` response)

**Step 2: Implement with OAuth2 client credentials flow**

```typescript
// server/worldmonitor/social/v1/reddit.ts
import { validateStringParam, SUBREDDIT_PATTERN, sanitizeTextContent } from '../../../../src/utils/validation';

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API = 'https://oauth.reddit.com';
const DEFAULT_SUBREDDITS = ['OSINT', 'geopolitics', 'CombatFootage', 'worldnews'];

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

export async function listRedditPosts(request: { subreddits: string[]; limit: number; sort: string }): Promise<any> {
  const token = await getOAuthToken();
  if (!token) return { posts: [], count: 0, status: 'error', errorMessage: 'Reddit OAuth2 credentials not configured' };

  const subs = request.subreddits.length > 0
    ? request.subreddits.map(s => validateStringParam(s, 'subreddit', 21, SUBREDDIT_PATTERN))
    : DEFAULT_SUBREDDITS;
  const limit = Math.min(request.limit || 25, 100);
  const sort = request.sort || 'hot';

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      const url = `${REDDIT_API}/r/${sub}/${sort}?limit=${limit}&raw_json=1`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'OmniSentinel/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json() as any;
      return (data.data?.children ?? []).map((child: any) => ({
        id: `reddit-${child.data.id}`,
        platform: 'reddit',
        author: `u/${child.data.author}`,
        content: sanitizeTextContent(`[r/${sub}] ${child.data.title}`, 500),
        url: `https://reddit.com${child.data.permalink}`,
        timestamp: (child.data.created_utc ?? 0) * 1000,
        mediaUrl: '', engagement: child.data.score ?? 0,
        latitude: 0, longitude: 0, subreddit: sub, hashtags: sub,
      }));
    }),
  );

  const posts = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<any[]>).value)
    .sort((a, b) => b.engagement - a.engagement);

  return { posts, count: posts.length, status: 'ok', errorMessage: '' };
}
```

**Step 3: Run tests, commit**

---

### Task 2.3: Twitter Handler (Adapter Pattern)

**Files:**
- Create: `server/worldmonitor/social/v1/twitter-adapters.ts`
- Create: `server/worldmonitor/social/v1/twitter.ts`
- Create: `server/worldmonitor/social/v1/twitter.test.mts`

**Step 1: Define adapter interface**

```typescript
// server/worldmonitor/social/v1/twitter-adapters.ts

export interface TwitterRawTweet {
  id: string; text: string; author: string; createdAt: string;
  likeCount: number; retweetCount: number; url: string;
}

export interface TwitterDataSource {
  searchTweets(query: string, limit: number): Promise<TwitterRawTweet[]>;
  getUserTweets(username: string, limit: number): Promise<TwitterRawTweet[]>;
  readonly name: string;
}

/** Default adapter: TwitterAPI.io -- $0.15/1K tweets */
export class TwitterApiIoAdapter implements TwitterDataSource {
  readonly name = 'twitterapi.io';
  private apiKey: string;
  constructor(apiKey: string) { this.apiKey = apiKey; }

  async searchTweets(query: string, limit: number): Promise<TwitterRawTweet[]> {
    const url = `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(query)}&queryType=Latest&cursor=`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': this.apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.tweets ?? []).slice(0, limit).map((t: any) => ({
      id: t.id, text: t.text ?? '', author: t.author?.userName ?? '',
      createdAt: t.createdAt ?? '', likeCount: t.likeCount ?? 0,
      retweetCount: t.retweetCount ?? 0, url: `https://x.com/i/status/${t.id}`,
    }));
  }

  async getUserTweets(username: string, limit: number): Promise<TwitterRawTweet[]> {
    return this.searchTweets(`from:${username}`, limit);
  }
}

/** Fallback: SocialData API */
export class SocialDataAdapter implements TwitterDataSource {
  readonly name = 'socialdata';
  private apiKey: string;
  constructor(apiKey: string) { this.apiKey = apiKey; }

  async searchTweets(query: string, limit: number): Promise<TwitterRawTweet[]> {
    const url = `https://api.socialdata.tools/twitter/search?query=${encodeURIComponent(query)}&type=Latest`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.tweets ?? []).slice(0, limit).map((t: any) => ({
      id: t.id_str ?? t.id, text: t.full_text ?? t.text ?? '',
      author: t.user?.screen_name ?? '', createdAt: t.tweet_created_at ?? '',
      likeCount: t.favorite_count ?? 0, retweetCount: t.retweet_count ?? 0,
      url: `https://x.com/i/status/${t.id_str ?? t.id}`,
    }));
  }

  async getUserTweets(username: string, limit: number): Promise<TwitterRawTweet[]> {
    return this.searchTweets(`from:${username}`, limit);
  }
}

/** Official X API (requires $200/mo Basic tier) */
export class OfficialXApiAdapter implements TwitterDataSource {
  readonly name = 'official-x';
  private bearerToken: string;
  constructor(bearerToken: string) { this.bearerToken = bearerToken; }

  async searchTweets(query: string, limit: number): Promise<TwitterRawTweet[]> {
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.min(limit, 100)}&tweet.fields=created_at,public_metrics,author_id`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.bearerToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.data ?? []).map((t: any) => ({
      id: t.id, text: t.text ?? '', author: t.author_id ?? '',
      createdAt: t.created_at ?? '', likeCount: t.public_metrics?.like_count ?? 0,
      retweetCount: t.public_metrics?.retweet_count ?? 0,
      url: `https://x.com/i/status/${t.id}`,
    }));
  }

  async getUserTweets(username: string, limit: number): Promise<TwitterRawTweet[]> {
    return this.searchTweets(`from:${username}`, limit);
  }
}

/** Factory: select adapter based on available credentials */
export function createTwitterAdapter(): TwitterDataSource | null {
  const twitterApiIoKey = process.env.TWITTER_API_IO_KEY;
  if (twitterApiIoKey) return new TwitterApiIoAdapter(twitterApiIoKey);

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (bearerToken) return new OfficialXApiAdapter(bearerToken);

  return null;
}
```

**Step 2: Implement twitter.ts handler** that uses `createTwitterAdapter()` and maps results to `SocialPost`.

**Step 3: Write tests, commit**

---

### Task 2.4: Bluesky Handler (AT Protocol)

**Files:**
- Create: `server/worldmonitor/social/v1/bluesky.ts`
- Create: `server/worldmonitor/social/v1/bluesky.test.mts`

Key points:
- Public API, no auth: `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts`
- Limit cap: **`Math.min(limit, 25)`** (AT Protocol max is 25)
- Map response to SocialPost

**Step 1-3: TDD cycle, commit**

---

### Task 2.5: YouTube Handler (Data API v3)

**Files:**
- Create: `server/worldmonitor/social/v1/youtube.ts`
- Create: `server/worldmonitor/social/v1/youtube.test.mts`

Key points:
- YouTube Data API v3: `https://www.googleapis.com/youtube/v3/search`
- API key from `process.env.YOUTUBE_API_KEY`
- Free tier: 10,000 units/day (search = 100 units -> ~100 searches/day)
- Parameters: `part=snippet&type=video&q={query}&maxResults={limit}&relevanceLanguage=en&order=date`
- Map: video title as content, thumbnail URL as mediaUrl, viewCount as engagement

```typescript
// Key implementation:
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3/search';

export async function listYouTubeVideos(request: { query: string; channelId: string; limit: number }) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { posts: [], count: 0, status: 'error', errorMessage: 'YouTube API key not configured' };

  const params = new URLSearchParams({
    part: 'snippet', type: 'video', key: apiKey,
    q: request.query || 'OSINT OR geopolitics OR military',
    maxResults: String(Math.min(request.limit || 10, 50)),
    order: 'date', relevanceLanguage: 'en',
  });
  if (request.channelId) params.set('channelId', request.channelId);

  const res = await fetch(`${YOUTUBE_API}?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { posts: [], count: 0, status: 'error', errorMessage: `YouTube API error: ${res.status}` };

  const data = await res.json() as any;
  const posts = (data.items ?? []).map((item: any) => ({
    id: `youtube-${item.id.videoId}`,
    platform: 'youtube',
    author: item.snippet.channelTitle ?? '',
    content: sanitizeTextContent(item.snippet.title ?? '', 500),
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    timestamp: new Date(item.snippet.publishedAt).getTime(),
    mediaUrl: item.snippet.thumbnails?.medium?.url ?? '',
    engagement: 0, latitude: 0, longitude: 0, subreddit: '', hashtags: '',
  }));

  return { posts, count: posts.length, status: 'ok', errorMessage: '' };
}
```

**Step 1-3: TDD cycle, commit**

---

### Task 2.6: TikTok Handler (Apify)

**Files:**
- Create: `server/worldmonitor/social/v1/tiktok.ts`
- Create: `server/worldmonitor/social/v1/tiktok.test.mts`

Key points:
- Uses Apify TikTok Scraper actor via REST API
- Runs on Railway worker (not edge -- Apify can be slow)
- `TIKTOK_APIFY_TOKEN` from env
- Map Apify response to SocialPost

**Step 1-3: TDD cycle, commit**

---

### Task 2.7: VK Handler

**Files:**
- Create: `server/worldmonitor/social/v1/vk.ts`
- Create: `server/worldmonitor/social/v1/vk.test.mts`

Key points:
- VK API v5: `https://api.vk.com/method/wall.get?owner_id={groupId}&v=5.199&access_token={token}`
- `VK_SERVICE_TOKEN` from env
- Monitor military-related public groups
- Default groups: `-1 (sample)` -- configurable via request

**Step 1-3: TDD cycle, commit**

---

### Task 2.8: Social Service Handler + Edge Function

**Files:**
- Create: `server/worldmonitor/social/v1/handler.ts`
- Create: `api/social/v1/[rpc].ts`
- Create: `src/services/social/index.ts`

**Step 1: Create handler.ts** -- wires all platform handlers into `SocialServiceHandler`

**Step 2: Create Edge Function** with `checkKillswitch('SOCIAL')`

**Step 3: Create client wrapper** with per-platform circuit breakers:
- Reddit: 5min cache
- Twitter: 1min cache
- Bluesky: 2min cache
- YouTube: 5min cache
- TikTok: 10min cache
- VK: 5min cache

**Step 4: Add `fetchAllSocialFeeds()` aggregator** that calls all platforms in parallel and merges results sorted by timestamp.

**Step 5: Commit**

---

### Task 2.9: SocialFeedPanel Frontend

**Files:**
- Create: `src/components/SocialFeedPanel.ts` (extends Panel, uses h() from @/utils/dom-utils)

**Step 1: Read existing TelegramIntelPanel** (`src/services/telegram-intel.ts` and its component) to copy the vanilla DOM Panel class pattern.

**Step 2: Create SocialFeedPanel** (extends Panel base class, uses `h()` helper -- NOT JSX)

Features:
- Platform filter tabs: All | Reddit | X | Bluesky | YouTube | TikTok | VK
- Each post rendered as `textContent` (never innerHTML)
- URLs sanitized with `sanitizeUrl()`
- Content truncated to 500 chars server-side
- Sliding window: max 100 posts in memory
- Deduplication by post ID
- Loading/error/disabled states per platform
- Error handling via try/catch with `createErrorDisplay()` from `error-display.ts`
- `createDataFreshnessIndicator()` at top

**Step 3: Commit**

---

### Task 2.10: i18n Keys for Social

**Files:**
- Modify: `src/locales/sentinel-en.json` (already created in Task 0.11)

Verify that the `sentinel.socialFeed` section in `src/locales/sentinel-en.json` contains the correct keys:

```json
"socialFeed": {
  "title": "Social Intelligence",
  "filterAll": "All",
  "filterReddit": "Reddit",
  "filterTwitter": "X",
  "filterBluesky": "Bluesky",
  "filterYouTube": "YouTube",
  "filterTikTok": "TikTok",
  "filterVK": "VK",
  "loading": "Loading social feeds...",
  "empty": "No posts available",
  "error": "Failed to load social feed",
  "disabled": "Social feed is not configured"
}
```

**Note:** Do NOT edit `src/locales/en.json` directly. All sentinel i18n keys live in `src/locales/sentinel-en.json`.

---

### Facebook Feasibility Note

> **Research status (March 2026):** Facebook is the #1 social platform in 120+ countries. The Meta Content Library API provides researcher access to public Facebook and Instagram content. Application requires institutional affiliation and research purpose description. For OSINT monitoring of conflict zones (Philippines, Myanmar, Sub-Saharan Africa), Facebook data is critical but API access is restricted. **Recommendation:** Apply for Meta Content Library access. If approved, add as Module 2.8 using the same SocialPost pattern. If denied, consider CrowdTangle alternatives or RSS feeds from Facebook Pages.

---

## Module 3: JP 3-60 Military Analysis Agent

**Goal:** AnalystPanel that uses Claude Predict RPC for structured 6-dimension military analysis with ethical disclaimer.

### Task 3.1: Proto Definitions (Analyst Service)

**Files:**
- Create: `proto/worldmonitor/analyst/v1/service.proto`
- Create: `proto/worldmonitor/analyst/v1/assessment.proto`

```protobuf
syntax = "proto3";
package worldmonitor.analyst.v1;

import "sebuf/http/annotations.proto";
import "worldmonitor/analyst/v1/assessment.proto";

service AnalystService {
  option (sebuf.http.service_config) = {base_path: "/api/analyst/v1"};

  rpc RunAssessment(AssessmentRequest) returns (AssessmentResponse) {
    option (sebuf.http.config) = {path: "/run-assessment", method: HTTP_METHOD_POST};
  }
}
```

The Analyst service wraps Claude's Predict RPC with additional context enrichment (auto-pulls recent headlines, social posts, etc. into the evidence array).

**Step 1: Create protos, generate, commit**

---

### Task 3.2: Assessment Handler + JP 3-60 Prompts

**Files:**
- Create: `server/worldmonitor/analyst/v1/handler.ts`
- Create: `server/worldmonitor/analyst/v1/assessment.ts`
- Create: `server/worldmonitor/analyst/v1/assessment.test.mts`
- Create: `server/worldmonitor/analyst/v1/jp360-prompts.ts`

**Step 1: Create jp360-prompts.ts** with the full JP 3-60 system prompt (uses Anthropic prompt caching via `cache_control: { type: "ephemeral" }` on the system message).

**Step 2: Write test** (mock Claude API, verify structured 6-dimension output)

**Step 3: Implement** -- single Claude call with system prompt + user query + auto-enriched context. Uses Sonnet model with 30min cache.

**Step 4: Create handler + Edge Function** with `checkKillswitch('ANALYST')`

**Step 5: Commit**

---

### Task 3.3: AnalystPanel Frontend

**Files:**
- Create: `src/components/AnalystPanel.ts` (extends Panel, uses h() from @/utils/dom-utils)

**Step 1: Read existing DeductionPanel** to copy the vanilla DOM Panel class pattern.

**Step 2: Create AnalystPanel** (extends Panel base class, uses `h()` helper -- NOT JSX) with:
- Text input for analysis query
- Region selector dropdown
- Timeframe selector (7d/30d/90d)
- "Analyze" button with loading state
- Output: structured report
- 6-dimension score display (bar chart or table)
- Overall probability with confidence badge
- **Ethical disclaimer** (P3-15): "This analysis is AI-generated and should not be used as the sole basis for decision-making. Probability scores are estimates based on publicly available data."
- `createDataFreshnessIndicator()` showing cache status
- Error handling via try/catch with `createErrorDisplay()` from `error-display.ts`

**Step 3: Verify i18n keys** in `src/locales/sentinel-en.json` (already pre-created in Task 0.11):

```json
"analyst": {
  "title": "JP 3-60 Analysis",
  "placeholder": "Enter analysis query (e.g., 'Middle East conflict trajectory next 7 days')",
  "analyze": "Run Analysis",
  "analyzing": "Analyzing...",
  "dimensions": "Dimension Scores",
  "probability": "Overall Probability",
  "confidence": "Confidence",
  "timeframe": "Timeframe",
  "noResults": "Enter a query to begin analysis",
  "error": "Analysis failed. Check your Claude API key in settings.",
  "disclaimer": "AI-generated estimate. Do not use as sole basis for decisions."
}
```

**Note:** Do NOT edit `src/locales/en.json` directly. All sentinel i18n keys live in `src/locales/sentinel-en.json`.

**Step 4: Commit**

---

## Module 4: Government Data (NOTAM only)

**Goal:** NOTAM/TFR flight restrictions from FAA API. DO NOT create separate NAVTEX service -- enhance existing maritime navigational warnings if needed.

### Task 4.1: NOTAM Proto + Handler

**Files:**
- Create: `proto/worldmonitor/govdata/v1/service.proto`
- Create: `proto/worldmonitor/govdata/v1/notam.proto`
- Create: `server/worldmonitor/govdata/v1/notam.ts`
- Create: `server/worldmonitor/govdata/v1/notam.test.mts`
- Create: `server/worldmonitor/govdata/v1/handler.ts`

**Step 1: Create protos** (MUST include `sebuf.http` annotations)

`proto/worldmonitor/govdata/v1/notam.proto`:
```protobuf
syntax = "proto3";
package worldmonitor.govdata.v1;

message Notam {
  string id = 1;
  string type = 2;           // "TFR" | "NOTAM" | "NAVAID"
  string description = 3;
  double latitude = 4;
  double longitude = 5;
  double radius_nm = 6;
  int64 effective_from = 7;
  int64 effective_to = 8;
  string source = 9;         // "FAA" | "ICAO"
  string location = 10;
}

message ListNotamsRequest { string region = 1; int32 limit = 2; }
message ListNotamsResponse {
  repeated Notam notams = 1; int32 count = 2;
  string status = 3; string error_message = 4;
}
```

`proto/worldmonitor/govdata/v1/service.proto`:
```protobuf
syntax = "proto3";
package worldmonitor.govdata.v1;

import "sebuf/http/annotations.proto";
import "worldmonitor/govdata/v1/notam.proto";

service GovdataService {
  option (sebuf.http.service_config) = {base_path: "/api/govdata/v1"};

  rpc ListNotams(ListNotamsRequest) returns (ListNotamsResponse) {
    option (sebuf.http.config) = {path: "/list-notams", method: HTTP_METHOD_GET};
  }
}
```

**Step 2: Write test** (mock FAA NOTAM API GeoJSON response)

**Step 3: Implement** -- fetch from `https://external-api.faa.gov/notamapi/v1/notams`, parse GeoJSON, map to proto

**Step 4: Create handler, Edge Function** with `checkKillswitch('GOVDATA')`, client wrapper

**Step 5: Run buf generate, commit**

---

### Task 4.2: NAVTEX -- Verify Existing Service

**Files:**
- Read: `server/worldmonitor/maritime/v1/list-navigational-warnings.ts`

**Step 1: Read the existing handler** to confirm it already covers NAVTEX/maritime warnings.

**Step 2: If coverage is sufficient**, no changes needed. If additional data sources are needed, make MINIMAL additions to the existing handler (not a new service).

**Step 3: Document** findings in commit message.

---

## Module 5: Historical Trajectory Database

**Goal:** Flight history via OpenSky REST API with map rendering.

> **IMPORTANT: OpenSky API Limitation.** The `/api/tracks/all` REST endpoint only returns the LAST known track (~1 hour of data), NOT full historical trajectories. For true historical data, you need either an SSH tunnel to OpenSky's Impala database or the `/api/states/all` state vectors endpoint (which is severely rate-limited for anonymous users: 10 req/min, 5s resolution).
>
> **Phase 1 (this module):** Use the `/api/tracks/all` endpoint for recent-track-only data (~last 1 hour). This is sufficient for "what is this aircraft doing right now" use cases.
>
> **Phase 2 (future):** For full historical trajectory queries (days/weeks of data), deploy a Railway worker with SSH access to the OpenSky Impala database. This requires an OpenSky registered account and SSH key setup.

### Task 5.1: Proto + Handler

**Files:**
- Create: `proto/worldmonitor/trajectory/v1/service.proto`
- Create: `proto/worldmonitor/trajectory/v1/flight_history.proto`
- Create: `server/worldmonitor/trajectory/v1/flight-history.ts`
- Create: `server/worldmonitor/trajectory/v1/flight-history.test.mts`
- Create: `server/worldmonitor/trajectory/v1/handler.ts`

**Step 1: Create proto**

```protobuf
syntax = "proto3";
package worldmonitor.trajectory.v1;

import "sebuf/http/annotations.proto";
import "worldmonitor/trajectory/v1/flight_history.proto";

service TrajectoryService {
  option (sebuf.http.service_config) = {base_path: "/api/trajectory/v1"};
  rpc QueryFlightHistory(FlightHistoryRequest) returns (FlightHistoryResponse) {
    option (sebuf.http.config) = {path: "/query-flight-history", method: HTTP_METHOD_GET};
  }
}

message FlightHistoryRequest {
  string icao24 = 1;
  int64 begin = 2;
  int64 end = 3;
}

message FlightHistoryResponse {
  repeated TrajectoryPoint points = 1;
  string callsign = 2;
  string status = 3;
  string error_message = 4;
}

message TrajectoryPoint {
  double latitude = 1; double longitude = 2; double altitude = 3;
  int64 timestamp = 4; double velocity = 5; double heading = 6; bool on_ground = 7;
}
```

**Step 2: Write test** (mock OpenSky response, validate icao24 hex)

**Step 3: Implement**

```typescript
// Key points:
// - OpenSky REST API: https://opensky-network.org/api/tracks/all?icao24={}&time={}
// - NOTE: /api/tracks/all only returns the LAST known track (~1 hour of data)
//   It does NOT return full historical trajectories. This is a Phase 1 limitation.
//   For full history, Phase 2 will need an SSH tunnel to the OpenSky Impala DB.
// - The 'time' param selects which track snapshot (0 = current, unix timestamp = specific)
// - Validate icao24 with validateHexParam(value, 'icao24', 6)
// - Downsample with Ramer-Douglas-Peucker if >500 points
// - Memory limit: max 10,000 points per response
// - 15s timeout
// - Anonymous rate limit: 10 req/min (consider caching aggressively)
```

**Step 4: Create handler, Edge Function** with `checkKillswitch('TRAJECTORY')`, client wrapper

**Step 5: Run buf generate, commit**

---

## Module 6: Enhanced Prediction Markets

**Goal:** Add Kalshi and Metaculus alongside existing Polymarket.

### Task 6.1: Create Separate Kalshi and Metaculus Services

> **IMPORTANT:** Do NOT extend the existing `proto/worldmonitor/prediction/v1/service.proto`. That file belongs to the upstream Polymarket implementation and editing it will cause merge conflicts. Instead, create separate proto directories for Kalshi and Metaculus.

**Files:**
- Read first: `proto/worldmonitor/prediction/v1/service.proto` (existing -- DO NOT modify)
- Read first: `server/worldmonitor/prediction/v1/handler.ts` (existing -- reference only)
- Create: `proto/worldmonitor/kalshi/v1/service.proto`
- Create: `proto/worldmonitor/kalshi/v1/market.proto`
- Create: `proto/worldmonitor/metaculus/v1/service.proto`
- Create: `proto/worldmonitor/metaculus/v1/question.proto`
- Create: `server/worldmonitor/kalshi/v1/handler.ts`
- Create: `server/worldmonitor/kalshi/v1/kalshi.ts`
- Create: `server/worldmonitor/kalshi/v1/kalshi.test.mts`
- Create: `server/worldmonitor/metaculus/v1/handler.ts`
- Create: `server/worldmonitor/metaculus/v1/metaculus.ts`
- Create: `server/worldmonitor/metaculus/v1/metaculus.test.mts`
- Create: `api/kalshi/v1/[rpc].ts`
- Create: `api/metaculus/v1/[rpc].ts`

**Step 1: Read existing prediction service** to understand current proto + handler structure. Do NOT modify it.

**Step 2: Create Kalshi proto and handler** (separate service)

`proto/worldmonitor/kalshi/v1/service.proto`:
```protobuf
syntax = "proto3";
package worldmonitor.kalshi.v1;

import "sebuf/http/annotations.proto";
import "worldmonitor/kalshi/v1/market.proto";

service KalshiService {
  option (sebuf.http.service_config) = {base_path: "/api/kalshi/v1"};

  rpc ListKalshiMarkets(ListKalshiMarketsRequest) returns (ListKalshiMarketsResponse) {
    option (sebuf.http.config) = {path: "/list-kalshi-markets", method: HTTP_METHOD_GET};
  }
}
```

```typescript
// Kalshi API: https://trading-api.kalshi.com/trade-api/v2/markets
// Public, no auth needed for read-only market data
// Filter for geopolitical/conflict markets
```

**Step 3: Create Metaculus proto and handler** (separate service)

`proto/worldmonitor/metaculus/v1/service.proto`:
```protobuf
syntax = "proto3";
package worldmonitor.metaculus.v1;

import "sebuf/http/annotations.proto";
import "worldmonitor/metaculus/v1/question.proto";

service MetaculusService {
  option (sebuf.http.service_config) = {base_path: "/api/metaculus/v1"};

  rpc ListMetaculusQuestions(ListMetaculusQuestionsRequest) returns (ListMetaculusQuestionsResponse) {
    option (sebuf.http.config) = {path: "/list-metaculus-questions", method: HTTP_METHOD_GET};
  }
}
```

```typescript
// Metaculus API: https://www.metaculus.com/api2/questions/
// Public, no auth needed
// Filter for geopolitical questions (category filtering)
```

**Step 4: Write tests for both** (mock API responses)

**Step 5: Create edge functions** `api/kalshi/v1/[rpc].ts` and `api/metaculus/v1/[rpc].ts` with killswitches

**Step 6: Update sentinel-cache-tiers.ts** if new paths differ from original plan (paths already pre-registered in Task 0.6)

**Step 7: Commit**

---

## Module 7: Expanded RSS/News

**Goal:** Config-only changes to add actually missing news sources. Remove duplicates that already exist in feeds.ts.

### Task 7.1: Audit Existing Feeds

**Step 1: Read `src/config/feeds.ts`** and catalog all existing source names in `SOURCE_TIERS` and feed URLs.

**Step 2: Cross-reference** with the master checklist. The following already exist and should NOT be re-added:
- RUSI (line 230 in SOURCE_TIERS, line 630 in feeds)
- The Diplomat (line 102, line 683)
- Nikkei Asia (line 183, line 688)
- CSIS (line 113, line 618)
- Carnegie (line 116, line 621)
- Atlantic Council (line 110, line 616)
- Brookings (line 115, line 620)
- Xinhua (line 120, line 686)
- MIIT (China) (line 128, line 695)
- MOFCOM (China) (line 129, line 696)

**Step 3: The following are ACTUALLY MISSING** and need to be added:
- ISW (Institute for the Study of War)
- INSS (Institute for National Security Studies, Israel)
- IISS (International Institute for Strategic Studies, UK)
- Al-Monitor (Middle East news)
- Middle East Eye
- Stars and Stripes (US military newspaper)

---

### Task 7.2: Add Missing Feeds

**Files:**
- Create: `src/config/sentinel-feeds.ts`
- Modify: `api/rss-proxy.js` (add to ALLOWED_DOMAINS)

**Step 1: Create sentinel-feeds.ts**

```typescript
// src/config/sentinel-feeds.ts
// New RSS feeds added by Sentinel. Imported into feeds.ts.
// These feeds are CONFIRMED to NOT exist in the upstream feeds.ts.

export const SENTINEL_SOURCE_TIERS: Record<string, number> = {
  'ISW': 3,
  'INSS': 3,
  'IISS': 3,
  'Al-Monitor': 3,
  'Middle East Eye': 3,
  'Stars and Stripes': 3,
};

export const SENTINEL_FEEDS = [
  { name: 'ISW', url: 'https://news.google.com/rss/search?q=site:understandingwar.org+when:3d&hl=en-US&gl=US&ceid=US:en' },
  { name: 'INSS', url: 'https://news.google.com/rss/search?q=site:inss.org.il+when:7d&hl=en-US&gl=US&ceid=US:en' },
  { name: 'IISS', url: 'https://news.google.com/rss/search?q=site:iiss.org+when:7d&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Al-Monitor', url: 'https://news.google.com/rss/search?q=site:al-monitor.com+when:3d&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Middle East Eye', url: 'https://news.google.com/rss/search?q=site:middleeasteye.net+when:3d&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Stars and Stripes', url: 'https://news.google.com/rss/search?q=site:stripes.com+when:3d&hl=en-US&gl=US&ceid=US:en' },
];
```

**Step 2: Add domains to ALLOWED_DOMAINS in rss-proxy.js**

Note: Since we're using Google News RSS as proxy (matching existing pattern), the domains are already allowed (`news.google.com` is already in the allowed list).

If direct feed URLs are used instead, add:

```javascript
'www.understandingwar.org',
'www.al-monitor.com',
'www.middleeasteye.net',
'www.stripes.com',
'www.inss.org.il',
'www.iiss.org',
```

**Step 3: Import in feeds.ts** (MINIMAL change)

```typescript
// SENTINEL: import additional feeds
import { SENTINEL_SOURCE_TIERS, SENTINEL_FEEDS } from './sentinel-feeds';
```

Spread `SENTINEL_SOURCE_TIERS` into `SOURCE_TIERS` and `SENTINEL_FEEDS` into the appropriate feeds array.

**Step 4: Commit**

```bash
git add src/config/sentinel-feeds.ts api/rss-proxy.js src/config/feeds.ts
git commit -m "feat(rss): add ISW, INSS, IISS, Al-Monitor, Middle East Eye, Stars and Stripes feeds"
```

---

## Post-Implementation Checklist

After all modules are complete:

- [ ] Run full test suite: `npx tsx --test 'src/**/*.test.mts' 'server/**/*.test.mts'` -- all tests pass
- [ ] Run `npm run generate` -- no proto errors
- [ ] Run `npm run typecheck:all` -- no type errors
- [ ] Verify all feature flags: enable/disable each module in settings
- [ ] Verify all killswitches: set `MODULE_*_ENABLED=false` for each module
- [ ] Test error display wrappers: simulate API failures for each panel (verify `createErrorDisplay()` renders correctly)
- [ ] Verify fork safety: `git diff upstream/main -- src/config/panels.ts src/services/summarization.ts src/services/runtime-config.ts server/gateway.ts` shows only import+spread lines
- [ ] Test upstream merge: `git merge upstream/main` produces minimal/no conflicts
- [ ] All i18n keys in `src/locales/sentinel-en.json` (loaded via `addResourceBundle`)
- [ ] `.env.example` has all new variables
- [ ] LEGAL.md reviewed for accuracy
- [ ] Claude spend tracking verified (check daily logs)
- [ ] Reddit OAuth2 token refresh working
- [ ] Twitter adapter returns data from TwitterAPI.io
- [ ] Bluesky limit capped at 25

---

## Execution Summary

| Module | Key Files Created | Key Files Modified |
|--------|-------------------|-------------------|
| 0. Infrastructure | `src/utils/validation.ts`, `src/utils/ai-response.ts`, `src/components/sentinel/error-display.ts`, `src/components/sentinel/DataFreshnessIndicator.ts`, `server/_shared/killswitch.ts`, `src/config/sentinel-features.ts`, `src/config/sentinel-panels.ts`, `server/sentinel-cache-tiers.ts`, `src/locales/sentinel-en.json`, `.gitattributes` | `runtime-config.ts` (~20 lines: feature IDs + secret keys + spreads), `panels.ts` (2 lines), `gateway.ts` (2 lines), `.env.example` (append), `package.json` |
| 1. Claude AI | `proto/claude/`, `server/claude/`, `api/claude/`, `src/services/claude/` | `summarization.ts` (2 lines: add type + prepend) |
| 2. Social Media | `proto/social/`, `server/social/` (6 platform handlers + adapters), `api/social/`, `src/services/social/`, `src/components/SocialFeedPanel.ts` | `sentinel-en.json` |
| 3. JP 3-60 | `proto/analyst/`, `server/analyst/`, `api/analyst/`, `src/components/AnalystPanel.ts` | `sentinel-en.json` |
| 4. Gov Data | `proto/govdata/`, `server/govdata/`, `api/govdata/` | Possibly existing maritime handler |
| 5. Trajectory | `proto/trajectory/`, `server/trajectory/`, `api/trajectory/`, `src/services/trajectory/` | None |
| 6. Prediction | `proto/kalshi/`, `proto/metaculus/`, `server/kalshi/`, `server/metaculus/`, `api/kalshi/`, `api/metaculus/` | None (separate protos, no upstream edits) |
| 7. RSS | `src/config/sentinel-feeds.ts` | `feeds.ts` (2 lines), `rss-proxy.js` (6 domains) |

**Total: ~55 new files, ~8 modified files (with minimal changes), 7 test files minimum (`.test.mts`)**

---

*Last updated: 2026-03-03. Comprehensive revision incorporating all 5 specialist reviews, synthesis critique, global platform research, Twitter/Telegram guide, owner decisions, and codebase analysis.*
