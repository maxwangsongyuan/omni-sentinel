# Ops, Reliability & DevEx Review -- Omni Sentinel

**Reviewer:** Ops, Reliability & DevEx
**Date:** 2026-03-03
**Scope:** Design doc + Implementation plan vs. existing codebase patterns
**Verdict:** CONDITIONAL APPROVE -- ship with the mitigations below or risk outages and contributor churn

---

## Executive Summary

The implementation plan adds 7 modules (~35 new files, ~10 modified) with zero tests, no phased rollout, no monitoring additions, and incomplete error handling. The existing codebase has strong foundations (circuit breakers, error mapper, cache tiers, Sentry, rate limiting) that the plan partially leverages -- but several critical gaps could take down the entire dashboard or cause silent data staleness.

**Top 3 risks, in priority order:**

1. **Claude API failures cascade into existing features** -- the plan rewires the summarization fallback chain to Claude-first but has no structured error response, no spend alerting, and no fallback beyond OpenRouter.
2. **Zero test coverage for 35+ new files** -- no unit tests, no integration tests, no contract tests for 5 new external APIs with distinct auth/rate-limit profiles.
3. **All 7 modules deploy simultaneously** -- no feature flags for progressive rollout, no canary strategy, no ability to disable a broken module without redeploying.

---

## 1. Error Handling & Graceful Degradation

### 1.1 Claude API Down

**What happens today:** The existing summarization chain (Ollama -> Groq -> OpenRouter -> Browser T5) has four fallback levels. If Groq is down, OpenRouter picks up; if both fail, the browser T5 model runs locally.

**What the plan does:** Task 1.5 replaces `API_PROVIDERS` with only two entries: Claude and OpenRouter. Browser T5 is described as "removed" in the design doc ("Remove Ollama/Groq/Browser T5"). This eliminates the local fallback entirely.

**Failure scenario:** If Claude API is down AND OpenRouter is down (or rate-limited), the user sees zero summarization. The `generateSummary` function returns `null`, and existing panels (World Brief, AI Deduction, Headline Memory) all show empty/error states.

**Recommendations:**
- Keep Browser T5 as a last-resort fallback. Removing it loses offline capability that the desktop app currently relies on.
- The Claude handler at `server/worldmonitor/claude/v1/summarize.ts` (lines 188-218 in the implementation plan) returns an empty `SummarizeResponse` on API failure (`{ summary: '', provider: 'claude', cached: false }`). This is not distinguishable from "no data available" -- the client cannot tell if Claude failed vs. had nothing to say. Add an `error` field or a status enum matching the existing `SUMMARIZE_STATUS_*` pattern in the news service.
- The `analyze.ts` handler (lines 255-297) does the same: returns empty defaults on failure. A silent failure from a JP 3-60 analysis is worse than no analysis because it shows "0% probability" with "low confidence," which a user could misread as an actual assessment.

### 1.2 Social Platform Rate Limiting

**Good:** The Reddit handler (Task 2.2) uses `Promise.allSettled` to isolate per-subreddit failures, so one blocked subreddit does not crash the entire feed. The client wrapper (Task 2.4) creates per-platform circuit breakers (`redditBreaker`, `twitterBreaker`, `blueskyBreaker`).

**Issues:**
- The Twitter handler silently returns `{ posts: [], count: 0 }` when the bearer token is missing or the API returns 429. The user has no visibility into whether Twitter is rate-limited vs. simply has no matching tweets.
- Reddit's public JSON API (`reddit.com/r/{sub}/hot.json`) is heavily rate-limited (60 req/min per IP). Since this runs as a Vercel Edge Function, ALL users share the same egress IP. With 4 default subreddits per request, a single user burns 4 requests. At 15 concurrent users, you hit 429 within one minute. The design doc says "OAuth2 `oauth.reddit.com`" with client credentials, but the implementation uses the unauthenticated JSON endpoint, which has much lower limits.
- No retry-after header propagation. When upstream APIs return `Retry-After`, the handlers swallow it.
- VK and TikTok are listed in the design doc but absent from the implementation plan. If they are added later, the social handler type stub (`listTweets: async () => (...)`) will silently hide the fact that they are not implemented.

**Recommendations:**
- Implement Reddit OAuth2 as specified in the design doc, not the unauthenticated JSON endpoint.
- Propagate rate-limit metadata (429 status, retry-after) through the response so the client circuit breaker can set appropriate cooldown durations rather than using the default 5-minute cooldown.
- Add a `status` field to `SocialFeedResponse` indicating per-platform health (e.g., `{ reddit: 'ok', twitter: 'rate_limited', bluesky: 'ok' }`).

### 1.3 OpenSky Returns No Data

The trajectory handler (`query-flight-history.ts`, Task 5.1) returns `{ icao24, callsign: '', points: [] }` when OpenSky fails. This is correct but the UI needs to handle the empty state -- the plan does not specify what the "View History" panel shows when `points` is empty.

OpenSky's free API has strict rate limits (unauthenticated: 100 req/day for track data). The project already has `OPENSKY_CLIENT_ID` / `OPENSKY_CLIENT_SECRET` env vars, but the trajectory handler does not use them -- it calls the unauthenticated endpoint.

**Recommendation:** Use the existing OpenSky OAuth credentials from the relay config. Add the empty-state UI specification to the panel component.

### 1.4 Global Error Boundary

**Status: Missing.** The existing codebase has NO React/Preact error boundary (`ErrorBoundary` search returned zero results). The gateway has a top-level try/catch (line 189-196 of `server/gateway.ts`), and Sentry is initialized in `src/main.ts`, but there is no component-level error boundary that would prevent a crashing `SocialFeedPanel` from taking down the entire dashboard.

**Recommendation:** Add a Preact error boundary wrapper for each new panel. This is critical because new panels call new external APIs that may return unexpected data shapes.

### 1.5 Circuit Breaker Configuration

The existing `CircuitBreaker` class (`src/utils/circuit-breaker.ts`) defaults to:
- `maxFailures: 2` (trips after 2 failures)
- `cooldownMs: 5 minutes`
- `cacheTtlMs: 10 minutes`

The implementation plan creates breakers with varied cache TTLs:

| Breaker | cacheTtlMs | persistCache |
|---------|-----------|-------------|
| Claude Summarize | 5min | true |
| Claude Analyze | 15min | true |
| Reddit | 5min | true |
| Twitter | 1min | true |
| Bluesky | 2min | true |

**Issue:** All breakers use the default `maxFailures: 2` and `cooldownMs: 5min`. For Twitter (1min cache TTL), this means: after 2 failures, Twitter is offline for 5 minutes. For Claude Analyze (15min cache), the same 5-minute cooldown may be too short -- it would retry Claude repeatedly during sustained outages, burning API credits.

**Recommendation:** Set `maxFailures` and `cooldownMs` proportional to the service's expected recovery time:
- Twitter: `maxFailures: 3, cooldownMs: 2min` (Twitter rate limits reset quickly)
- Claude API: `maxFailures: 2, cooldownMs: 15min` (API outages tend to be longer; saves credits)
- OpenSky trajectory: `maxFailures: 1, cooldownMs: 30min` (strict daily quota)

---

## 2. Monitoring & Observability

### 2.1 How Do We Know When Something Breaks?

**Existing monitoring:**
- **Sentry** (`@sentry/browser` in `src/main.ts`): Client-side error tracking with 10% trace sampling. Ignores common WebGL/network errors. Only reports from browser context.
- **Vercel Analytics** (`@vercel/analytics`): Injected in `main.ts`.
- **Console logging**: The gateway and error mapper log to `console.error` / `console.warn`. Vercel retains Edge Function logs for 1 hour on Pro (24h on Enterprise).

**Gaps:**
- **No server-side Sentry**: Edge Function errors are logged to `console.error` in `gateway.ts` and `error-mapper.ts`, but NOT sent to Sentry. If Claude API returns 500, it is logged as `[error-mapper] 500: ...` and disappears after Vercel log retention expires.
- **No structured logging**: All error messages are unstructured strings. Searching for "Claude Analyze failures this week" in Vercel logs requires grepping through raw text.
- **No alerting**: There are no alerts for error rate spikes, circuit breaker trips, or API spend thresholds.

### 2.2 Health Check Endpoints

**Status: None planned.** The implementation plan adds 5 new edge function entry points but no health check endpoint. Existing services also lack health checks.

**Recommendation:** Add a `/api/health` endpoint that returns aggregate circuit breaker status (the existing `getCircuitBreakerStatus()` function at line 263 of `circuit-breaker.ts` already provides this). This enables external uptime monitoring (e.g., Vercel Checks, UptimeRobot, Better Uptime).

### 2.3 Claude API Spend Alerting

**Critical gap.** The Claude API key is stored in `localStorage` (client-side) and passed as `process.env.CLAUDE_API_KEY` on the server. The design doc says `claude-sonnet-4-20250514` with `max_tokens: 1024-2048`.

With the JP 3-60 analysis pipeline making potentially 6 sequential Claude calls per analysis (per the design doc, though the implementation consolidates to 1), plus summarization calls, costs can accumulate rapidly. There is no budget cap, no usage tracking, and no alerting.

**Recommendations:**
- Use the Anthropic SDK's built-in usage tracking (response includes `usage.input_tokens` and `usage.output_tokens`). Emit these to analytics.
- Set a daily/monthly spend cap via Anthropic's API settings.
- Add a client-side usage counter that warns the user when approaching thresholds.
- The existing `trackLLMUsage(provider, model, cached)` function in `src/services/analytics.ts` should be extended to track token counts.

### 2.4 Vercel Function Log Retention

Vercel Pro retains runtime logs for 1 hour. For debugging production issues with third-party APIs (Claude, Reddit, Twitter, FAA NOTAM), 1 hour is insufficient.

**Recommendation:** Add a structured logging drain to an external service (Axiom, Datadog, or even Upstash Redis). The Upstash Redis integration is already in the project (`@upstash/redis` for rate limiting).

---

## 3. Deployment Strategy

### 3.1 Deploying 7 New Services Simultaneously

The design doc explicitly states: "All features developed in parallel, no phased rollout." This is the highest-risk deployment decision in the plan.

**Risk matrix:**

| Scenario | Impact | Likelihood |
|----------|--------|-----------|
| Claude API key misconfigured | Summarization breaks for ALL users | Medium |
| Reddit unauthenticated API rate-limited | Social panel empty, edge function 429s fill logs | High |
| FAA NOTAM API endpoint changed | GovData service returns empty, no visible error | Medium |
| OpenSky trajectory query overloads free tier | Existing military flight data affected (shared IP) | Medium |
| New RSS feeds have malformed XML | Existing news digest breaks | Low |
| `buf generate` produces incompatible types | Build fails, deploy blocked | Low |

### 3.2 Feature Flag Rollout

**Existing system:** The runtime config system (`src/services/runtime-config.ts`) supports feature toggles with localStorage persistence. This is a client-side system -- it gates feature visibility in the browser but does NOT prevent server-side code from running.

**Plan gaps:**
- Task 2.4 registers `socialReddit`, `socialTwitter`, `socialBluesky` as feature flags, but the edge functions have no feature flag check. The API endpoints are always live. A disabled feature flag only hides the UI panel; the backend still processes requests if called directly.
- No server-side feature flag system exists. Vercel environment variables could serve this purpose (e.g., `FEATURE_SOCIAL_ENABLED=false`), but this requires redeployment to change.

**Recommendations:**
- Add server-side feature flag checks in edge functions. Check for a Vercel env var (e.g., `CLAUDE_ENABLED`) before routing to the handler. Return 503 with a descriptive message when disabled.
- Use Vercel's preview deployments to test each module independently before merging to main.
- Deploy modules in order of risk: RSS expansion (Module 7, config-only) first, then Government Data (Module 4, low blast radius), then Social (Module 2), then Claude/Analyst (Modules 1/3), then Prediction Markets (Module 6, extends existing), then Trajectory (Module 5).

### 3.3 Rollback Strategy

**Current state:** The `vercel.json` `ignoreCommand` skips deployments when only docs/scripts change. Vercel supports instant rollback to any previous deployment via the dashboard.

**Gap:** If a new service causes issues, the only rollback is to the previous Vercel deployment (all-or-nothing). There is no way to roll back Module 2 (Social) while keeping Module 1 (Claude) live.

**Recommendation:** Module-level killswitches via environment variables. Each new edge function should check `process.env.MODULE_{NAME}_ENABLED !== 'false'` before routing.

### 3.4 Environment Variable Management

**Current state:** The `.env.example` file documents 26 environment variables. The plan adds at least 10 more:

| New Variable | Service | Required? |
|-------------|---------|-----------|
| `CLAUDE_API_KEY` | Claude AI | Yes (for AI features) |
| `TWITTER_BEARER_TOKEN` | Twitter/X | Yes (for Twitter feed) |
| `FAA_API_KEY` | NOTAM | Yes (for TFR data) |
| `OPENSKY_USER` | Trajectory | No (unauthenticated fallback) |
| `OPENSKY_PASS` | Trajectory | No (unauthenticated fallback) |
| `KALSHI_API_KEY` | Prediction | No (public API) |
| `METACULUS_API_KEY` | Prediction | No (public API) |
| `APIFY_TOKEN` | TikTok | Yes (for TikTok, future) |
| `VK_SERVICE_TOKEN` | VK | Yes (for VK, future) |
| `REDDIT_CLIENT_ID` | Reddit OAuth | Should be (see 1.2) |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth | Should be (see 1.2) |

This brings the total to 36+ environment variables across Vercel and Railway.

**Recommendations:**
- Update `.env.example` with all new variables, grouped by module with clear comments about which are optional.
- Add a `scripts/validate-env.mjs` script that checks for required variables at build time and warns about missing optional ones.
- Document which features work with zero API keys (RSS, Bluesky, public Polymarket, ACLED public) vs. which require keys.

---

## 4. Developer Experience

### 4.1 Build Time Impact

The project currently has 22 proto service directories under `proto/worldmonitor/`. The plan adds 4 new directories (claude, social, govdata, trajectory) with 12 new `.proto` files.

`buf generate proto/` regenerates ALL proto packages. With the current `buf.gen.yaml` running 4 plugins (ts-client, ts-server, openapiv3 JSON, openapiv3 YAML), adding 12 protos means 48 additional codegen operations per `buf generate` run.

**Impact estimate:** Current `buf generate` likely takes 5-15 seconds. Adding 4 packages should add ~3-5 seconds. This is acceptable.

**TypeScript build impact:** `tsc` must compile all generated files. The `tsconfig.json` includes the entire `src/` directory. Generated code goes into `src/generated/client` and `src/generated/server`. Adding ~24 new generated files (12 protos x 2 plugins) may add 1-2 seconds to `tsc --noEmit`. Acceptable.

**Vite build impact:** Minimal -- Vite only bundles client-side code. Server code under `server/` and `api/` is bundled separately by Vercel.

### 4.2 Local Development Setup

**Current flow:** Copy `.env.example` to `.env.local`, fill in API keys, run `npm run dev`.

**Post-implementation:** A contributor would need to:
1. Install Node.js (version not pinned -- no `.nvmrc`, no `.node-version`, no `engines` field in `package.json`)
2. Install dependencies (`npm install`)
3. Install `buf` CLI for proto generation (not in `package.json`)
4. Copy `.env.example` to `.env.local`
5. Obtain API keys for any features they want to test
6. Run `npx buf generate proto/` (not in `package.json` scripts)
7. Run `npm run dev`

**Issues:**
- No `.nvmrc` or `engines` field to pin Node.js version. The `tsconfig.json` targets ES2020, and the project uses top-level `await` patterns, so Node.js 18+ is implicitly required but not documented.
- `buf` CLI is not a project dependency. It must be installed globally. This is a friction point for new contributors.
- No `npm run generate` script. The implementation plan uses `npx buf generate proto/` manually.
- No development mode for API mocking. Running `npm run dev` without API keys shows empty panels with no explanation of why.

**Recommendations:**
- Add `.nvmrc` with `20` (or `22` if using latest LTS).
- Add `buf` to `devDependencies` or document the installation step.
- Add `"generate": "buf generate proto/"` to `package.json` scripts.
- Add `"generate:check": "buf generate proto/ && git diff --exit-code src/generated/"` to CI.
- Consider adding mock data files for local development so panels render without API keys.

### 4.3 Testing Strategy (see also Section 7)

**Current test infrastructure:**
- `@playwright/test` for E2E tests: `e2e/` directory (but currently empty in the project -- likely from upstream)
- `tsx --test` for data tests: `tests/` directory (also empty in the project)
- `node --test` for sidecar/API tests: `api/_cors.test.mjs`, `api/cyber-threats.test.mjs`, etc.
- `scripts/validate-rss-feeds.mjs` for feed validation
- Visual regression tests with golden screenshots

The implementation plan has NO tests whatsoever. See Section 7 for detailed analysis.

### 4.4 `.env.example` Documentation

The current `.env.example` (170 lines) is well-organized with section headers and links to API registration pages. It clearly states "All keys are optional -- the dashboard works without them."

The plan does not update `.env.example`. This must be done as part of the implementation.

---

## 5. Data Freshness & Staleness

### 5.1 Cache TTL Spectrum

The plan introduces cache TTLs ranging from 1 minute (Twitter) to 1 hour (Trajectory history). Combined with the existing gateway cache tiers:

| Tier | Edge CDN `s-maxage` | `stale-while-revalidate` | `stale-if-error` |
|------|-------------------|------------------------|-----------------|
| fast | 120s (2min) | 30s | 300s (5min) |
| medium | 300s (5min) | 60s | 600s (10min) |
| slow | 900s (15min) | 120s | 1800s (30min) |
| static | 3600s (1h) | 300s | 7200s (2h) |

This means the actual data staleness can be much longer than the nominal TTL. For example, the "fast" tier Twitter endpoint (`/api/social/v1/list-tweets`) has:
- Client-side circuit breaker cache: 1 minute
- Edge CDN cache: 2 minutes + 30s revalidation window
- `stale-if-error`: 5 minutes during upstream failure

In the worst case (upstream down), Twitter data could be 5+ minutes stale. For the "slow" tier Claude analyze endpoint, data could be 30 minutes stale during an outage.

### 5.2 Last-Updated Timestamps

**Status: Not implemented.** The existing `BreakerDataState` type (in `circuit-breaker.ts`) tracks a `timestamp` field and a `mode` field (`live`, `cached`, `unavailable`). However, this data is not currently surfaced in the UI.

The plan's response types include `cached: boolean` in `SummarizeResponse` and timestamps in `SocialPost`, but there is no UI component showing "Last updated: 3 minutes ago" or "Showing cached data."

**Recommendation:** Add a `<DataFreshnessIndicator>` component that reads `getDataState()` from the relevant circuit breaker and displays:
- Green dot + "Live" when `mode === 'live'`
- Yellow dot + "Cached (X min ago)" when `mode === 'cached'`
- Red dot + "Unavailable" when `mode === 'unavailable'`

This is especially important for the JP 3-60 Analyst panel, where users make decisions based on the analysis freshness.

### 5.3 Manual Refresh

No manual refresh capability is mentioned in the plan. The circuit breaker's `clearCache()` method exists but is not exposed to the UI.

**Recommendation:** Add a "Refresh" button to each panel that calls `breaker.clearCache()` and re-fetches. This is critical for the Social Feed panel (users may want to check for breaking news) and the Trajectory panel (users tracking a specific flight).

---

## 6. Dependency Management

### 6.1 New npm Packages

The implementation plan's `summarize.ts` handler calls the Anthropic API directly via `fetch()` rather than using the official `@anthropic-ai/sdk`. This is a deliberate choice -- it avoids adding a dependency and works in Edge Functions (which have size limits).

**However:** The design doc's tech stack says "Anthropic SDK." The implementation plan contradicts this by using raw `fetch`. This is fine for MVP but loses:
- Automatic retry with exponential backoff
- Token counting
- Streaming support
- Type-safe request/response types

**Recommendation:** Document the decision to use raw `fetch` instead of the SDK. If/when streaming support is needed (for real-time analysis output), the SDK will be required. Pin to `@anthropic-ai/sdk@^0.39` (latest at time of review) when adding it.

### 6.2 Proto Toolchain

- `buf` CLI version is not pinned in the project. The `buf.yaml` and `buf.gen.yaml` exist under `proto/`, but there is no `buf.lock` version constraint on the CLI itself.
- The `protoc-gen-ts-client` and `protoc-gen-ts-server` plugins are referenced as `local:` in `buf.gen.yaml`, meaning they are expected to be available on `PATH`. These are likely custom/vendored plugins (sebuf). New contributors need instructions on how to install them.

**Recommendation:** Document the exact `buf` CLI version and plugin installation steps. Consider using `npx @bufbuild/buf` instead of a global install.

### 6.3 Node.js Version

No `.nvmrc`, `.node-version`, or `engines` field. The project uses:
- ES2020 target in `tsconfig.json`
- ESNext modules
- `AbortSignal.timeout()` (Node.js 18+)
- Top-level await patterns

**Recommendation:** Add `"engines": { "node": ">=20" }` to `package.json` and create `.nvmrc` with `20`.

---

## 7. Testing Gap -- CRITICAL

### 7.1 Current State

The implementation plan contains **zero tests** across 35 new files and 10 modified files. The existing project has:
- E2E tests via Playwright (empty `e2e/` directory in this fork, but scripts exist)
- API handler tests via Node.js `--test` (`api/_cors.test.mjs`, `api/cyber-threats.test.mjs`, etc.)
- RSS feed validation script
- Visual regression tests

### 7.2 What Must Be Tested

**Priority 1 -- Unit tests (block deployment):**

| Component | Why | Risk if Untested |
|-----------|-----|-----------------|
| Claude `analyze.ts` JSON parsing | Parses LLM output as JSON; malformed output crashes handler | User sees empty analysis with no error |
| `summarize.ts` fallback chain modification | Core feature change; regression could break existing summarization | All AI features broken |
| Reddit `listRedditPosts` response parsing | Reddit JSON shape is undocumented and can change | Silent empty feeds |
| Twitter `listTweets` response parsing | X API v2 response shape with nested `public_metrics` | Silent failures |
| `fetchAllSocialFeeds` Promise.allSettled aggregation | Partial failure handling | One platform failure hides all data |
| NOTAM FAA API response parsing | Deeply nested `coreNOTAMData.notam` path | Empty map overlays |
| OpenSky trajectory `path` array parsing | Array-of-arrays with positional indices | Wrong lat/lng rendering |

**Priority 2 -- Integration tests (block production launch):**

| Test | What It Validates |
|------|------------------|
| Claude API round-trip | API key auth, request format, response parsing |
| Reddit OAuth token exchange | Token acquisition, refresh, rate limit headers |
| Circuit breaker state transitions | failure -> cooldown -> recovery cycle |
| Gateway cache tier assignment | New RPCs get correct cache headers |
| Feature flag gating | Disabled feature returns 503, not empty 200 |

**Priority 3 -- E2E tests (nice to have for launch):**

| Test | What It Validates |
|------|------------------|
| Social panel renders with mock data | Component doesn't crash on load |
| Analyst panel form submission | Input -> API call -> result display |
| Trajectory panel empty state | "No data available" shown, not blank |
| Settings panel shows new API key fields | Claude, Twitter, FAA key inputs visible |

### 7.3 Recommended Test Framework Additions

The project already uses Node.js built-in test runner. For the new handlers:

```
tests/
  claude-summarize.test.mts    -- mock fetch, test response parsing
  claude-analyze.test.mts      -- mock fetch, test JSON parsing edge cases
  social-reddit.test.mts       -- mock reddit JSON, test post mapping
  social-twitter.test.mts      -- mock X API response, test engagement calc
  social-bluesky.test.mts      -- mock AT Protocol response
  govdata-notams.test.mts      -- mock FAA GeoJSON, test NOTAM parsing
  trajectory.test.mts          -- mock OpenSky path array
  circuit-breaker-config.test.mts -- verify TTL/cooldown settings
```

**Estimated effort:** 2-3 days for Priority 1 tests. These should be written BEFORE the handlers to catch parsing bugs early (TDD approach aligns with your investigation principles).

---

## 8. Configuration Complexity

### 8.1 API Key Onboarding Friction

After this implementation, a user deploying Omni Sentinel needs to obtain API keys from:

| Provider | Effort | Free Tier | Required For |
|----------|--------|-----------|-------------|
| Anthropic (Claude) | Sign up + credit card | $5 credit | AI summarization, analysis |
| Twitter/X | Apply for developer account (days) | 100 tweets/month (read) | Twitter feed |
| FAA NOTAM | Sign up | Free | TFR map overlays |
| Reddit | Create app on reddit.com/prefs/apps | Free | Reddit feed (if using OAuth) |
| Kalshi | Sign up | Free | Prediction markets |
| Metaculus | Sign up | Free | Prediction markets |
| Groq | Sign up | 14,400 req/day | AI fallback |
| OpenRouter | Sign up | 50 req/day | AI fallback |
| Upstash Redis | Sign up | 10K commands/day | Rate limiting, caching |
| Finnhub | Sign up | Free | Market data |
| Plus 10+ existing keys... | ... | ... | ... |

Total: 20+ API keys across 15+ providers. This is an extreme onboarding barrier.

### 8.2 What Works Without Keys

Based on code analysis, the following should work with zero configuration:

- Map rendering (MapLibre + public tile servers)
- RSS news feeds (public RSS, proxied via `/api/rss-proxy.js`)
- Bluesky social feed (AT Protocol is public, no auth needed)
- Earthquake data (USGS public API)
- GDACS disaster alerts (public)
- Wikipedia current events
- Basic Polymarket data (public Gamma API)
- OpenSky basic flight data (unauthenticated, low rate limit)

### 8.3 Progressive Enhancement Strategy

**Current:** The runtime config system already supports optional features. The `.env.example` says "All keys are optional." Each `RUNTIME_FEATURES` entry has a `fallback` description.

**Gap:** The plan does not define a tiered onboarding experience. A new user who deploys without any keys should see a useful dashboard with clear indicators of what is disabled and how to enable it.

**Recommendations:**
- Create a "Quick Start" configuration tier: just the free-tier APIs (Groq, FRED, Finnhub) that give the most value. Document this as "5-minute setup."
- Create a "Full" configuration tier: all APIs. Document this as "production setup."
- Add an onboarding panel in the settings UI that shows a checklist of configured vs. unconfigured features with direct links to each API's registration page.
- For the Claude API specifically: show a clear cost estimate ("Claude Sonnet costs ~$3/1M input tokens; typical daily usage: X calls = ~$Y/month") so users can make informed decisions.

---

## 9. Security Considerations

### 9.1 API Key Exposure

The design doc stores `CLAUDE_API_KEY` in `localStorage` (`wm-config-CLAUDE_API_KEY`). This is the existing pattern for client-side API keys. However:
- `localStorage` is accessible to any JavaScript running on the same origin, including browser extensions.
- The edge functions access keys via `process.env`, which is injected by Vercel at deploy time. These are secure.
- The implementation's `summarize.ts` reads `process.env.CLAUDE_API_KEY` on the server side, meaning the key is a Vercel environment variable, NOT the client-side localStorage value. There is a disconnect between the design doc ("localStorage") and the implementation ("process.env").

**Recommendation:** Clarify the key storage strategy. If Claude keys are server-side only (Vercel env vars), update the design doc. If they are client-side (localStorage), the edge function needs to accept them from the request header (like the existing `X-WorldMonitor-Key` pattern).

### 9.2 CORS Configuration

The `vercel.json` headers set `Access-Control-Allow-Origin: *` for all API routes. This is fine for a public dashboard but means any website can call the Omni Sentinel API and consume Claude API credits using the server's key.

The existing `isDisallowedOrigin()` check in `gateway.ts` provides origin filtering, but the `vercel.json` static CORS headers bypass this for non-edge-function routes.

**Recommendation:** Ensure all new API routes go through the gateway (which they do, via `createDomainGateway`), and add rate limiting per-origin for Claude endpoints to prevent credit abuse.

---

## 10. Action Items Summary

### Must-Fix Before Merge

| # | Item | Effort | Owner |
|---|------|--------|-------|
| 1 | Add error/status fields to Claude response types | 1h | Backend |
| 2 | Keep Browser T5 as last-resort fallback in summarization chain | 30m | Backend |
| 3 | Use Reddit OAuth2 instead of unauthenticated JSON | 2h | Backend |
| 4 | Add Preact error boundary for new panels | 2h | Frontend |
| 5 | Update `.env.example` with all new variables | 1h | DevOps |
| 6 | Add `.nvmrc` with Node.js 20 | 5m | DevOps |
| 7 | Add `"generate"` script to `package.json` | 5m | DevOps |
| 8 | Write Priority 1 unit tests (7 test files) | 2-3d | All |

### Should-Fix Before Production

| # | Item | Effort | Owner |
|---|------|--------|-------|
| 9 | Add server-side feature flag checks in edge functions | 3h | Backend |
| 10 | Add `/api/health` endpoint | 2h | Backend |
| 11 | Add `DataFreshnessIndicator` component | 3h | Frontend |
| 12 | Add Claude API spend tracking + alerting | 4h | Backend |
| 13 | Tune circuit breaker thresholds per-service | 1h | Backend |
| 14 | Deploy modules in phased order, not all at once | 0h (process) | DevOps |
| 15 | Add structured logging drain for edge functions | 4h | DevOps |

### Nice-to-Have

| # | Item | Effort |
|---|------|--------|
| 16 | Integration tests for external API contracts | 2d |
| 17 | Manual refresh button per panel | 2h |
| 18 | Onboarding checklist panel in settings | 4h |
| 19 | Mock data mode for local development | 1d |
| 20 | Pin `buf` CLI version in project | 30m |

---

## Appendix: File References

| File | Role in Review |
|------|---------------|
| `/Users/maxwsy/workspace/omni-sentinel/server/gateway.ts` | Gateway pipeline, cache tiers, error boundary |
| `/Users/maxwsy/workspace/omni-sentinel/server/error-mapper.ts` | Error-to-HTTP mapping for edge functions |
| `/Users/maxwsy/workspace/omni-sentinel/src/utils/circuit-breaker.ts` | Circuit breaker implementation with SWR + persistent cache |
| `/Users/maxwsy/workspace/omni-sentinel/src/services/runtime-config.ts` | Feature flags, secret management, toggle system |
| `/Users/maxwsy/workspace/omni-sentinel/src/services/summarization.ts` | Current AI fallback chain being modified |
| `/Users/maxwsy/workspace/omni-sentinel/src/services/prediction/index.ts` | Existing prediction market pattern (Polymarket) |
| `/Users/maxwsy/workspace/omni-sentinel/server/_shared/rate-limit.ts` | Upstash rate limiting (600 req/60s sliding window) |
| `/Users/maxwsy/workspace/omni-sentinel/.env.example` | Current environment variable documentation |
| `/Users/maxwsy/workspace/omni-sentinel/vercel.json` | Deployment config, CORS headers, CSP |
| `/Users/maxwsy/workspace/omni-sentinel/package.json` | Build scripts, dependencies, missing `engines` field |
| `/Users/maxwsy/workspace/omni-sentinel/tsconfig.json` | TypeScript config (ES2020 target, strict mode) |
| `/Users/maxwsy/workspace/omni-sentinel/proto/buf.gen.yaml` | Proto codegen pipeline (4 plugins) |
| `/Users/maxwsy/workspace/omni-sentinel/src/main.ts` | Sentry initialization, Vercel analytics |
