# Omni Sentinel -- Scalability & Architecture Review

**Reviewer:** Scalability & Architecture Reviewer (AI-assisted)
**Date:** 2026-03-03
**Documents reviewed:**
- `docs/plans/2026-03-03-omni-sentinel-design.md` (Approved Design)
- `docs/plans/2026-03-03-omni-sentinel-implementation.md` (Implementation Plan)
- Existing codebase: `server/gateway.ts`, `src/services/summarization.ts`, `src/services/telegram-intel.ts`, `src/config/panels.ts`, `src/utils/circuit-breaker.ts`, `src/services/prediction/index.ts`, `src/services/runtime-config.ts`, `package.json`

**Summary:** The Omni Sentinel design is architecturally sound -- it correctly follows World Monitor's established proto-first, domain-split edge function pattern. However, the plan introduces significant scaling concerns across 11 dimensions. This review identifies 23 findings, of which 4 are Critical, 7 are High, 8 are Medium, and 4 are Low severity.

---

## Table of Contents

1. [Vercel Edge Function Limits](#1-vercel-edge-function-limits)
2. [Caching Strategy](#2-caching-strategy)
3. [Circuit Breaker Design](#3-circuit-breaker-design)
4. [Concurrent API Calls](#4-concurrent-api-calls)
5. [Bundle Size Impact](#5-bundle-size-impact)
6. [Data Flow Bottlenecks](#6-data-flow-bottlenecks)
7. [State Management](#7-state-management)
8. [Railway Relay](#8-railway-relay)
9. [Proto Codegen](#9-proto-codegen)
10. [Feature Flag Explosion](#10-feature-flag-explosion)
11. [Upstream Merge Compatibility](#11-upstream-merge-compatibility)

---

## 1. Vercel Edge Function Limits

### Finding 1.1: Edge Function Count Approaching Plan Limits

- **Severity:** High
- **Component:** `api/*/v1/[rpc].ts` (all edge function entry points)
- **Issue:** The project currently has 21 edge function entry points (each `api/{domain}/v1/[rpc].ts` deploys as a separate Vercel Edge Function). The plan adds 4 new ones: `api/claude/v1/[rpc].ts`, `api/social/v1/[rpc].ts`, `api/govdata/v1/[rpc].ts`, `api/trajectory/v1/[rpc].ts`. This brings the total to 25 Edge Functions, plus ~23 legacy JS-based serverless functions (`api/*.js`). Vercel's Hobby plan allows 12 serverless functions per deployment, and Pro allows unlimited, but each has individual memory and timeout constraints. On the Free/Hobby tier, exceeding limits will cause deployment failures.
- **Recommendation:** (a) Confirm the project is on Vercel Pro. (b) Consider consolidating related edge functions. For example, `govdata` and `trajectory` could share an edge function since they are low-frequency, reducing cold-start surface. (c) Document the expected function count in the deployment runbook.

### Finding 1.2: Claude Analyze RPC May Exceed 25s Edge Function Timeout

- **Severity:** Critical
- **Component:** `server/worldmonitor/claude/v1/analyze.ts`, `api/claude/v1/[rpc].ts`
- **Issue:** The Claude Analyze RPC sends a request to Anthropic's API with `max_tokens: 2048` and a complex system prompt (JP 3-60 framework). Claude Sonnet responses with structured JSON at 2048 tokens typically take 8-15 seconds. However, this is a single call within the JP 3-60 pipeline. The design document describes a "6-step analysis pipeline" (Section 3, JP 3-60), where "each step is a Claude API call." If executed within a single edge function invocation, 6 sequential Claude calls would require 48-90 seconds -- far exceeding the 25-second Vercel Edge Function timeout (free tier) or even the 300-second Pro tier limit for edge.
- **Recommendation:** (a) The implementation plan only shows a single `analyze` RPC, not 6 sequential calls. Clarify whether the 6-step pipeline is collapsed into a single prompt (current implementation) or truly sequential. (b) If sequential is intended: move the pipeline to a Railway worker (no timeout limit), use streaming SSE to push intermediate results to the client, or split into 6 separate RPCs called client-side. (c) For the single-call approach: set `max_tokens: 4096` to allow structured JSON output, and add a 20-second `AbortSignal.timeout()` with graceful degradation.

### Finding 1.3: Cold Start Amplification

- **Severity:** Medium
- **Component:** `server/gateway.ts` (shared import in all edge functions)
- **Issue:** The existing architecture wisely splits domains into separate edge functions to reduce bundle size ("cutting cold-start cost by ~20x" per the gateway.ts comment). However, `server/gateway.ts` imports the entire `RPC_CACHE_TIER` map (currently ~80 entries, growing to ~90 with new routes). While the comment says "~3KB negligible," the real cold-start cost is Vercel's V8 isolate initialization. Adding 4 new edge functions means 4 more potential cold starts. The Social feed panel will trigger 3 parallel edge function calls (Reddit, Twitter, Bluesky) via a single `fetchAllSocialFeeds()` call -- if all 3 are cold, the user experiences 3 parallel 200-500ms cold starts.
- **Recommendation:** (a) Keep the existing domain-split pattern -- it is correct. (b) Warm the social edge function during initial page load with a preconnect hint. (c) Consider adding `Cache-Control: stale-while-revalidate` aggressively on social endpoints so that even cold-start responses can be served from Vercel's edge cache.

---

## 2. Caching Strategy

### Finding 2.1: Claude API Cache TTLs Are Too Short for Cost Efficiency

- **Severity:** Critical
- **Component:** `server/gateway.ts` (RPC_CACHE_TIER), `src/services/claude/index.ts`
- **Issue:** The design assigns Claude Summarize a "medium" cache (5 min s-maxage = 300s) and Claude Analyze a "slow" cache (15 min s-maxage = 900s). At current Anthropic pricing (~$3/M input tokens, ~$15/M output tokens for Sonnet), a single analyze call costs approximately $0.01-0.05 depending on context length. With the app refreshing data on a 5-15 minute cycle, and assuming ~100 daily active users each triggering summarization, this could reach 1,200+ Claude API calls per day ($12-60/day) just for summarization. The existing upstream codebase uses server-side Redis deduplication (referenced in `summarization.ts` comment "Server-side Redis caching handles cross-user deduplication"), but the new Claude service does not integrate with Redis.
- **Recommendation:** (a) Increase Claude Summarize TTL to at least 15 minutes ("slow" tier, s-maxage=900s). Headlines rarely change within 5 minutes, and stale summaries are acceptable. (b) Increase Claude Analyze TTL to at least 1 hour ("static" tier, s-maxage=3600s). Geopolitical analysis does not meaningfully change in 15 minutes. (c) Implement content-addressable caching: hash the input headlines and use the hash as a cache key. Same headlines should always return cached results regardless of TTL expiry. (d) Add Redis-based deduplication to the Claude handler (matching the existing `summarizeArticle` RPC pattern in `server/worldmonitor/news/v1/`). This prevents multiple concurrent users from triggering duplicate Claude API calls.

### Finding 2.2: Dual-Layer Cache Inconsistency

- **Severity:** High
- **Component:** `src/services/claude/index.ts`, `server/gateway.ts`
- **Issue:** The Claude client wrapper creates circuit breakers with their own `cacheTtlMs` (5min for summarize, 15min for analyze), which is an in-browser cache. Simultaneously, `server/gateway.ts` sets Vercel edge `Cache-Control` headers on the same endpoints. This creates a dual-layer cache: browser circuit breaker cache + Vercel CDN edge cache. If the browser cache expires before the CDN cache, the browser makes a request that hits CDN cache (cheap). But if the CDN cache expires before the browser cache, the browser serves stale data longer than intended. The TTLs happen to align here (both 5min/15min), but this is fragile and not documented.
- **Recommendation:** (a) Document the dual-layer caching strategy explicitly. (b) Set the client-side circuit breaker `cacheTtlMs` slightly shorter than the server-side `s-maxage` so that client requests always hit CDN cache when possible. For example: client = 4min, CDN = 5min for summarize. (c) Consider removing client-side TTL caching entirely for Claude endpoints and relying on `stale-while-revalidate` CDN behavior, since the circuit breaker already handles stale-while-revalidate in its `execute()` method.

### Finding 2.3: Social Media Cache TTLs Not Differentiated by Platform Volatility

- **Severity:** Medium
- **Component:** `server/gateway.ts`, `src/services/social/index.ts`
- **Issue:** The design assigns Twitter a 1-minute cache and Bluesky a 2-minute cache, but the implementation maps Twitter to "fast" (s-maxage=120s = 2min) and Bluesky to "fast" (also 120s). The design's 1-minute Twitter cache cannot be expressed with the existing tier system (minimum "fast" tier = 120s). Meanwhile, Reddit uses "medium" (300s = 5min), which is reasonable. However, the Twitter API v2 rate limit on Recent Search is 450 requests per 15 minutes (30/min). With 100 users and a 2-minute CDN cache, the edge function would be called ~30 times per hour -- well within limits. But without CDN caching (e.g., POST requests that bypass cache), this could spike.
- **Recommendation:** (a) All social RPCs should use GET methods (the proto definitions correctly specify `HTTP_METHOD_GET`) to benefit from CDN caching. (b) Consider adding a "very-fast" tier (s-maxage=60, SWR=15) for Twitter if real-time monitoring is a requirement. (c) Add rate-limit tracking per upstream API in the handlers (independent of the circuit breaker, which only counts failures, not quota usage).

### Finding 2.4: No Cache Invalidation Strategy

- **Severity:** Medium
- **Component:** All new services
- **Issue:** The plan does not describe any cache invalidation mechanism. The existing codebase has a `cache-purge.js` API endpoint, but it is not referenced in any of the new service designs. For an intelligence platform, stale data during a breaking event (e.g., a military strike occurs and NOTAMs change immediately) could be operationally significant. Relying purely on TTL-based expiration means users may see stale NOTAM data for up to 15 minutes after a real-world event.
- **Recommendation:** (a) Document the expected staleness window for each data source. (b) Consider adding a manual "refresh" button per panel that bypasses cache (adding `?_nocache=1` query param that the gateway could honor). (c) For NOTAM data specifically, consider reducing TTL to 5 minutes ("fast" tier) since NOTAMs are high-value pre-strike indicators as noted in the design.

---

## 3. Circuit Breaker Design

### Finding 3.1: Shared Circuit Breaker for Heterogeneous Social Media Platforms

- **Severity:** High
- **Component:** `src/services/social/index.ts`
- **Issue:** The implementation creates separate circuit breakers per platform (redditBreaker, twitterBreaker, blueskyBreaker) -- this is correct. However, the `fetchAllSocialFeeds()` function uses `Promise.allSettled()` to call all three, which means a broken Twitter API does not block Reddit or Bluesky. This is the right pattern. The concern is that the existing circuit breaker defaults (`maxFailures: 2`, `cooldownMs: 5min`) may be too aggressive for platforms like the Twitter API v2, which returns 429 rate-limit responses that should not trigger a circuit break (they are expected behavior, not failures).
- **Recommendation:** (a) Differentiate circuit breaker thresholds by platform. Twitter should have `maxFailures: 5` and `cooldownMs: 2min` due to expected rate-limit responses. (b) Add HTTP status code awareness to the circuit breaker: 429 responses should trigger backoff (exponential, with `Retry-After` header) rather than failure counting. The current circuit breaker in `src/utils/circuit-breaker.ts` treats all exceptions uniformly -- it has no concept of retryable vs. permanent failures.

### Finding 3.2: Circuit Breaker Does Not Distinguish Server vs. Client Errors

- **Severity:** High
- **Component:** `src/utils/circuit-breaker.ts`
- **Issue:** The circuit breaker's `execute()` method catches all exceptions and calls `recordFailure()` uniformly (line 244-248 of circuit-breaker.ts). A 400 Bad Request (client error, our bug) is treated the same as a 503 Service Unavailable (upstream down). With 5+ new external APIs, each with different error semantics, this will cause confusion. For example: if the Reddit handler sends a malformed request, the circuit breaker opens and the entire Reddit feed goes dark for 5 minutes, even though the issue is a code bug, not an upstream outage.
- **Recommendation:** (a) Add error classification to the circuit breaker. Only count 5xx and network errors toward the failure threshold. 4xx errors should be logged but not counted (they indicate code bugs, not upstream instability). (b) Add a `shouldTrip` callback option to `CircuitBreakerOptions` so each breaker can customize which errors count. (c) This is a change to existing code (`src/utils/circuit-breaker.ts`), but it is backward-compatible if the default `shouldTrip` counts all errors (preserving current behavior).

### Finding 3.3: No Circuit Breaker on Claude API Calls in Server Handler

- **Severity:** High
- **Component:** `server/worldmonitor/claude/v1/summarize.ts`, `server/worldmonitor/claude/v1/analyze.ts`
- **Issue:** The Claude server handlers (`summarize.ts`, `analyze.ts`) call the Anthropic API directly via `fetch()` with no timeout or circuit breaking on the server side. The only circuit breaker is on the client side (`src/services/claude/index.ts`). If the Anthropic API is slow (e.g., returning responses in 20+ seconds), the edge function will hang until Vercel's timeout kills it. The handler will return a 500, the client circuit breaker will count a failure, and after 2 failures, all Claude features go dark for 5 minutes. Meanwhile, the OpenRouter fallback (specified in the design) is never attempted because the client-side fallback logic is not implemented -- the implementation plan only shows a direct Claude client, not a fallback chain.
- **Recommendation:** (a) Add `AbortSignal.timeout(15000)` to the Anthropic API fetch calls in the server handlers (matching the 15s timeout used in `query-flight-history.ts`). (b) Implement the OpenRouter fallback in the server handler, not the client. The handler should catch Anthropic API failures and retry with OpenRouter before returning an error. (c) Return partial results with an error indicator rather than empty responses on failure.

---

## 4. Concurrent API Calls

### Finding 4.1: Social Feed Panel Triggers Fan-Out of 3-5 Parallel Edge Function Calls

- **Severity:** Medium
- **Component:** `src/services/social/index.ts` (`fetchAllSocialFeeds`)
- **Issue:** `fetchAllSocialFeeds()` calls `Promise.allSettled([fetchRedditPosts(), fetchTweets(), fetchBlueskyPosts()])`. Each of these makes an HTTP request to a separate Vercel edge function, which in turn calls an external API. On initial load, this is a 3-way fan-out. The design also mentions TikTok (via Railway) and VK, bringing the total to 5. Each edge function has its own cold start. The resulting waterfall is:

  ```
  Browser -> Edge Function (cold start: 200-500ms) -> External API (500-3000ms)
  x3-5 parallel
  ```

  Total wall-clock time: max(all cold starts + API latencies) = ~1-4 seconds. This is acceptable for a dashboard, but the user sees no data until all resolve (or until each individually resolves if rendering is incremental).

- **Recommendation:** (a) Render each platform's results as they arrive (not waiting for all). The current `Promise.allSettled` waits for all before returning. Consider using a streaming pattern or individual per-platform hooks. (b) Add loading skeletons per platform tab. (c) Consider an aggregation endpoint: a single `fetchSocialFeed` edge function that internally calls all platform APIs, reducing client-to-server round trips from 3 to 1. The handler would use `Promise.allSettled` server-side. This avoids 3 separate cold starts. (d) Ensure the social edge function handler itself has a reasonable `AbortSignal.timeout()` so one slow platform does not hold up the others.

### Finding 4.2: Prediction Market Cross-Platform Comparison Adds 2 More Parallel API Calls

- **Severity:** Low
- **Component:** `server/worldmonitor/prediction/v1/`
- **Issue:** Adding Kalshi and Metaculus alongside the existing Polymarket creates a 3-platform prediction market panel. Polymarket already uses a complex 4-strategy fallback (direct -> Tauri -> Vercel proxy -> Railway -> sebuf handler). Adding 2 more platforms means the prediction panel could trigger up to 7 network requests in the worst case. However, the existing circuit breaker pattern handles this gracefully.
- **Recommendation:** (a) Ensure Kalshi and Metaculus handlers have independent circuit breakers (not sharing with Polymarket). (b) Consider staggered loading: load Polymarket first (most popular), then lazy-load Kalshi/Metaculus when the user switches tabs.

---

## 5. Bundle Size Impact

### Finding 5.1: Anthropic SDK Not Used -- Raw Fetch Instead

- **Severity:** Low (Positive Finding)
- **Component:** `server/worldmonitor/claude/v1/summarize.ts`, `analyze.ts`
- **Issue:** The implementation plan uses raw `fetch()` calls to the Anthropic API instead of the `@anthropic-ai/sdk` npm package. This is actually a good decision -- the Anthropic SDK is ~2MB and would significantly inflate the edge function bundle. The design document mentions "Anthropic SDK" but the implementation avoids it.
- **Recommendation:** Document this deliberate choice. If the Anthropic SDK is ever added, ensure it is tree-shaken and only imported in the Claude edge function bundle, not shared across all edge functions.

### Finding 5.2: No Social Media SDKs Planned

- **Severity:** Low (Positive Finding)
- **Component:** `server/worldmonitor/social/v1/*.ts`
- **Issue:** The implementation uses raw HTTP APIs for all social platforms (Reddit JSON API, Twitter v2 REST, Bluesky AT Protocol public API). No platform-specific SDKs are added to `package.json`. This is the correct approach for edge functions.
- **Recommendation:** Keep this pattern. If TikTok is added via Apify, use their REST API directly rather than the Apify npm SDK.

### Finding 5.3: Generated Proto Code Size Growth

- **Severity:** Medium
- **Component:** `src/generated/` directory
- **Issue:** The project currently has 120 proto files generating 42 TypeScript files. The plan adds ~15 new proto files across 5 new packages (claude, social, analyst, govdata, trajectory). This will generate ~10-15 new TypeScript files. Each generated client/server file is typically 5-20KB. The concern is not the server bundle (edge functions are split by domain) but the client bundle: every new `ServiceClient` class is imported in the frontend. The `fetchAllSocialFeeds()` function imports `SocialServiceClient`, which includes the full generated type definitions for all social RPCs.
- **Recommendation:** (a) Ensure Vite's tree-shaking eliminates unused RPC methods from the client bundle. (b) Verify with `npx vite-bundle-visualizer` after implementation that new generated code adds less than 50KB to the main chunk. (c) Consider lazy-loading service clients for panels that are not visible on initial load (e.g., Analyst panel, Trajectory panel).

---

## 6. Data Flow Bottlenecks

### Finding 6.1: JP 3-60 Pipeline Latency is Underspecified

- **Severity:** Critical
- **Component:** `server/worldmonitor/claude/v1/analyze.ts`, Design Section 3
- **Issue:** The design document describes a 6-step JP 3-60 pipeline where "each step is a Claude API call with step-specific system prompt and data context." However, the implementation plan collapses this into a single `Analyze` RPC with one Claude call using the full JP 3-60 system prompt. This discrepancy needs resolution:

  - **If single call (current implementation):** Latency = ~8-15 seconds for one Claude Sonnet call with 2048 max_tokens. This is acceptable for the 25s edge function timeout, but the quality of analysis may suffer because a single prompt cannot replicate the iterative refinement of 6 specialized steps.

  - **If 6 sequential calls (design intent):** Latency = 6 x 8-15 seconds = 48-90 seconds. This exceeds all Vercel edge/serverless timeouts. It also costs ~$0.10-0.30 per analysis run (6x the token usage).

  - **Step 2 ("Target Development")** is particularly concerning: it requires "auto-pull relevant data from ADS-B, AIS, ACLED, GDELT, social media" before sending to Claude. This is an N+1 data fetch problem within a single RPC.

- **Recommendation:** (a) Clarify the design intent. If 6 steps are truly needed, implement as a client-orchestrated pipeline: the frontend calls 6 separate RPCs sequentially, displaying intermediate results as each completes (progressive disclosure). (b) For the single-call approach: enrich the system prompt with pre-fetched data. Before calling Claude, the handler should fetch ACLED, GDELT, and ADS-B data in parallel (`Promise.allSettled`), then embed it in the user prompt. This changes the flow to: `parallel data fetch (2-5s) + Claude call (8-15s) = 10-20s`, which fits within a 25s timeout. (c) Add a loading UX with progress steps so the user knows the analysis is in progress.

### Finding 6.2: Trajectory History Query Can Return Unbounded Data

- **Severity:** Medium
- **Component:** `server/worldmonitor/trajectory/v1/query-flight-history.ts`
- **Issue:** The OpenSky `tracks/all` API returns the entire flight path as an array of `[timestamp, lat, lon, alt, heading]` arrays. A long-haul flight can have 500-2000 track points. The response is serialized as JSON in the edge function response. For multiple concurrent trajectory queries (user clicks several aircraft), this could generate significant response sizes (50-200KB each) and memory usage within the 128MB edge function limit.
- **Recommendation:** (a) Add server-side downsampling: if the track has more than 200 points, apply Ramer-Douglas-Peucker simplification. (b) Limit the time range in the proto definition (e.g., max 24 hours of history per query). (c) Add pagination or chunked responses for long trajectories.

### Finding 6.3: NOTAM Handler Assumes GeoJSON Response Format

- **Severity:** Medium
- **Component:** `server/worldmonitor/govdata/v1/list-notams.ts`
- **Issue:** The implementation assumes the FAA NOTAM API returns GeoJSON format with `items[].properties.coreNOTAMData.notam.*` and `items[].geometry.coordinates`. The FAA NOTAM API v1 actually returns a different structure -- the deeply nested `coreNOTAMData` path suggests the ICAO NOTAM API or a different version. If the API response format does not match, all NOTAM data will silently return empty strings (the code defaults to `''` on missing fields rather than throwing).
- **Recommendation:** (a) Validate the actual FAA NOTAM API response format before implementation. The FAA NOTAM API requires registration and returns XML by default, not GeoJSON. (b) Add response validation: if the parsed NOTAM has empty `id` and `location`, log a warning rather than silently returning bad data. (c) Consider using the AviationStack API (already referenced in the design) as primary, with FAA as fallback, since the existing codebase already has `aviationStack` as a feature flag.

---

## 7. State Management

### Finding 7.1: Trajectory Time-Slider Data in Browser Memory

- **Severity:** High
- **Component:** Frontend trajectory panel (to be created)
- **Issue:** The design specifies "Click aircraft/vessel on map -> View History button -> Renders historical track line on map with time slider." The time slider requires all trajectory points to be in browser memory simultaneously for smooth scrubbing. A 24-hour flight track with 1-second resolution = 86,400 points x ~40 bytes each = ~3.4MB per track. If the user views multiple aircraft histories simultaneously (not unlikely for a military tracking scenario), memory usage scales linearly. With 10 concurrent tracks: ~34MB. Combined with the existing map's deck.gl layers, WebGL buffers, and other panel data, this could push total browser memory usage past 200MB on mobile devices.
- **Recommendation:** (a) Downsample trajectory data client-side to match the time-slider resolution. A 600px-wide slider needs at most 600 data points, not 86,400. (b) Limit concurrent visible trajectories to 3-5. (c) Use a web worker to process and downsample trajectory data off the main thread. (d) Release trajectory data from memory when the history panel is closed (add cleanup in the panel's unmount lifecycle).

### Finding 7.2: Social Feed Panel Can Accumulate Unbounded Post Lists

- **Severity:** Medium
- **Component:** `src/services/social/index.ts` (`fetchAllSocialFeeds`)
- **Issue:** `fetchAllSocialFeeds()` aggregates posts from all platforms into a single array sorted by timestamp. Each platform returns up to 25 posts (Reddit) + 20 posts (Twitter) + 25 posts (Bluesky) = 70 posts minimum. With TikTok and VK added later, this grows to ~120 posts. Each post includes text, tags, URLs, and geo-coordinates. At ~500 bytes per post, this is ~60KB per refresh. If the panel polls every 2 minutes and accumulates without deduplication, memory grows linearly.
- **Recommendation:** (a) Implement a sliding window: keep only the latest 100 posts in memory, discarding older ones. (b) Add deduplication by post ID when refreshing. (c) Use virtual scrolling in the panel component to avoid DOM node explosion.

---

## 8. Railway Relay

### Finding 8.1: TikTok via Apify Scraper Has Uncertain Reliability

- **Severity:** Medium
- **Component:** TikTok handler (planned, not yet in implementation)
- **Issue:** The design specifies TikTok data via "Apify scraper" running on a Railway worker. Apify scrapers are inherently fragile -- they break when TikTok changes their DOM structure or API. The 10-minute cache TTL partially mitigates this, but extended Apify downtime (days) would leave the TikTok feed permanently empty. Additionally, Railway workers have their own scaling concerns: the free tier allows 500 hours/month ($5/mo for Pro), and Apify API calls have per-run costs ($0.25-$5 per scraper run depending on complexity).
- **Recommendation:** (a) Implement the TikTok handler as genuinely optional -- the panel should gracefully degrade to show "TikTok unavailable" rather than showing an empty tab. (b) Set the TikTok circuit breaker cooldown to 30 minutes (not the default 5 minutes) since Apify recovery is slow. (c) Add cost monitoring: if the Apify scraper is called more than 100 times/day, something is wrong with caching. (d) Consider TikTok's official Research API (available since 2023) as an alternative -- it requires application approval but is more stable than scraping.

### Finding 8.2: Railway Worker Scaling for Multiple Relay Functions

- **Severity:** Medium
- **Component:** Railway deployment (existing + planned)
- **Issue:** The existing architecture already uses Railway for a WebSocket relay and Polymarket proxy. Adding TikTok scraping to the same Railway worker creates a multi-purpose service with different scaling characteristics: the WS relay needs persistent connections (memory-bound), the Polymarket proxy needs burst HTTP handling (CPU-bound), and TikTok scraping is long-running and CPU-intensive. Railway charges by resource usage, and a single service cannot scale differently for each workload.
- **Recommendation:** (a) Deploy TikTok scraping as a separate Railway service, not co-located with the existing WS relay. (b) Use Railway's cron functionality to pre-fetch TikTok data on a schedule (every 10 minutes) rather than on-demand, storing results in a shared cache (Railway Redis or Upstash, which is already a dependency). (c) This decouples the scraping latency from user-facing request latency.

---

## 9. Proto Codegen

### Finding 9.1: Build Time Impact from New Proto Packages

- **Severity:** Low
- **Component:** `proto/worldmonitor/*/v1/*.proto`, build pipeline
- **Issue:** The project currently has 120 proto files across ~18 packages, generating 42 TypeScript files. The plan adds ~15 new proto files across 5 new packages (claude: 3 protos, social: 5 protos, analyst: 2 protos, govdata: 2 protos, trajectory: 2 protos). This is a ~12.5% increase in proto count. `buf generate` is typically fast (<5 seconds for this scale), so the build time impact is negligible. However, the generated TypeScript files feed into `tsc` compilation, and each new service client adds type-checking work.
- **Recommendation:** (a) The build time impact is minimal -- no action needed. (b) Consider running `buf lint` in CI to catch proto compatibility issues early. (c) Pin the `buf` version in the project to prevent unexpected codegen changes.

### Finding 9.2: Generated Code Not in .gitignore Creates Merge Conflicts

- **Severity:** Medium
- **Component:** `src/generated/` directory
- **Issue:** The implementation plan commits generated code (`git add src/generated/`). If upstream World Monitor also generates code into `src/generated/`, every upstream merge will conflict on generated files. Even if upstream does not add new protos, regenerating with a different `buf` version could produce different output, causing spurious diffs.
- **Recommendation:** (a) Add `src/generated/` to `.gitignore` and generate during build time (`prebuild` script). This eliminates generated code as a merge conflict surface. (b) If generated code must be committed (for Vercel serverless compatibility), add a `buf generate` step to the Vercel build command and mark `src/generated/` as "ours" in `.gitattributes` for merge conflict resolution.

---

## 10. Feature Flag Explosion

### Finding 10.1: Feature Flag Count Doubles from 21 to ~32

- **Severity:** High
- **Component:** `src/services/runtime-config.ts`
- **Issue:** The existing codebase has 21 `RuntimeFeatureId` values with a corresponding `defaultToggles` record that must have an entry for every ID (TypeScript enforces this). The plan adds at least 11 new flags: `aiClaude`, `socialReddit`, `socialTwitter`, `socialBluesky`, `socialTikTok`, `socialVK`, `govNotams`, `govNavtex`, `govSanctions`, `trajectoryHistory`, `predictionKalshi`, `predictionMetaculus`. This brings the total to ~32 feature flags. The settings UI (not shown in the plan) would need to display all of these, creating a long, unwieldy configuration panel.
- **Recommendation:** (a) Group feature flags hierarchically. Instead of individual `socialReddit`, `socialTwitter`, etc., use a single `socialFeeds` flag with a sub-configuration for per-platform toggles. (b) Add feature flag categories to `RuntimeFeatureDefinition` (e.g., `category: 'ai' | 'social' | 'govdata' | 'trajectory'`) for UI grouping. (c) Consider a "presets" system: "Minimal" (core only), "Standard" (core + social + markets), "Full" (everything). (d) Ensure the `defaultToggles` record is updated atomically -- if a new flag is added but its default is missing, the TypeScript compiler will catch it, but runtime behavior could still be unexpected if localStorage has stale toggle data.

### Finding 10.2: Feature Flags Stored in localStorage Without Migration

- **Severity:** Medium
- **Component:** `src/services/runtime-config.ts` (lines 261-265)
- **Issue:** The `readStoredToggles()` function reads from localStorage key `worldmonitor-runtime-feature-toggles` and parses it as `Partial<Record<RuntimeFeatureId, boolean>>`. If a user has saved toggles from before the update, the new flags (e.g., `aiClaude`) will be missing from their localStorage. The code handles this by merging with `defaultToggles` (line 265: `const parsed = JSON.parse(stored) as Partial<...>`), so new flags will use defaults. However, if a flag is removed in a future update, the old value will persist in localStorage forever, causing a memory leak and potential confusion.
- **Recommendation:** (a) Add a schema version to the localStorage data. When the version changes, migrate old data by removing unknown keys and adding new defaults. (b) Add a `KNOWN_FEATURE_IDS` set and filter localStorage data against it during hydration.

---

## 11. Upstream Merge Compatibility

### Finding 11.1: High Conflict Surface in Core Files

- **Severity:** Critical
- **Component:** `server/gateway.ts`, `src/services/summarization.ts`, `src/config/panels.ts`, `src/services/runtime-config.ts`
- **Issue:** The plan modifies 4 files that are actively developed upstream in World Monitor:

  | File | Modification | Conflict Risk |
  |------|-------------|---------------|
  | `server/gateway.ts` | Add ~10 new RPC_CACHE_TIER entries | **High** -- upstream frequently adds/reorders entries |
  | `src/services/summarization.ts` | Replace API_PROVIDERS array, add 'claude' type | **Very High** -- upstream actively iterates on AI providers |
  | `src/config/panels.ts` | Add new panel entries to FULL_PANELS | **High** -- upstream adds panels regularly |
  | `src/services/runtime-config.ts` | Add new RuntimeFeatureId values, new defaults | **High** -- upstream adds features regularly |

  Every upstream merge will likely conflict on these 4 files. The `summarization.ts` change is the most dangerous: the plan replaces the entire `API_PROVIDERS` array (removing Ollama and Groq), which will conflict with any upstream change to the provider chain.

- **Recommendation:** (a) Do not replace the `API_PROVIDERS` array. Instead, prepend the Claude provider to the existing array:
  ```typescript
  const API_PROVIDERS: ApiProviderDef[] = [
    { featureId: 'aiClaude', provider: 'claude', label: 'Claude' },
    // ... existing providers unchanged
  ];
  ```
  This minimizes the diff and preserves backward compatibility. Users without a Claude API key will fall through to the existing chain.

  (b) For `gateway.ts`: add new cache tier entries at the end of the `RPC_CACHE_TIER` object, separated by a comment block (`// --- Omni Sentinel extensions ---`). This makes merge conflicts easy to resolve.

  (c) For `panels.ts`: add new panels at the end of `FULL_PANELS`, with a comment delimiter.

  (d) For `runtime-config.ts`: add new feature IDs at the end of the union type, with a comment delimiter.

  (e) Consider extracting Omni Sentinel-specific config into separate files that are imported and merged:
  ```typescript
  // src/config/panels-sentinel.ts (new file, never conflicts with upstream)
  export const SENTINEL_PANELS = {
    'social-feed': { name: 'Social Intelligence', enabled: true, priority: 2 },
    analyst: { name: 'JP 3-60 Analyst', enabled: true, priority: 1 },
  };

  // src/config/panels.ts (minimal upstream modification)
  import { SENTINEL_PANELS } from './panels-sentinel';
  const FULL_PANELS = { ...UPSTREAM_PANELS, ...SENTINEL_PANELS };
  ```

### Finding 11.2: Proto Package Namespace Isolation is Correct

- **Severity:** Low (Positive Finding)
- **Component:** `proto/worldmonitor/*/v1/`
- **Issue:** The plan adds new proto packages under unique namespaces (`claude`, `social`, `analyst`, `govdata`, `trajectory`) that do not overlap with any existing upstream packages. This is the correct approach -- upstream will never add a `claude` or `social` package, so these protos will never conflict.
- **Recommendation:** No changes needed. This is well-designed.

### Finding 11.3: New API Route Directories Do Not Conflict

- **Severity:** Low (Positive Finding)
- **Component:** `api/claude/`, `api/social/`, `api/govdata/`, `api/trajectory/`
- **Issue:** All new API route directories are in fresh namespaces that do not exist upstream. This eliminates edge function merge conflicts.
- **Recommendation:** No changes needed.

---

## Summary of Findings

| # | Severity | Component | Finding |
|---|----------|-----------|---------|
| 1.1 | High | `api/*/v1/[rpc].ts` | Edge function count approaching plan limits (21 -> 25) |
| 1.2 | **Critical** | `server/claude/v1/analyze.ts` | Claude Analyze RPC may exceed 25s edge function timeout |
| 1.3 | Medium | `server/gateway.ts` | Cold start amplification with 4 new edge functions |
| 2.1 | **Critical** | `server/gateway.ts` | Claude API cache TTLs too short for cost efficiency |
| 2.2 | High | `src/services/claude/index.ts` | Dual-layer cache inconsistency (browser + CDN) |
| 2.3 | Medium | `server/gateway.ts` | Social media cache TTLs not differentiated by platform volatility |
| 2.4 | Medium | All new services | No cache invalidation strategy |
| 3.1 | High | `src/services/social/index.ts` | Circuit breaker thresholds not differentiated per platform |
| 3.2 | High | `src/utils/circuit-breaker.ts` | Circuit breaker does not distinguish server vs. client errors |
| 3.3 | High | `server/claude/v1/*.ts` | No circuit breaker or timeout on server-side Claude API calls |
| 4.1 | Medium | `src/services/social/index.ts` | Social feed triggers 3-5 parallel cold starts |
| 4.2 | Low | `server/prediction/v1/` | Prediction market cross-platform comparison adds 2 more API calls |
| 5.1 | Low (+) | `server/claude/v1/*.ts` | Raw fetch used instead of Anthropic SDK (good) |
| 5.2 | Low (+) | `server/social/v1/*.ts` | No social media SDKs added (good) |
| 5.3 | Medium | `src/generated/` | Generated proto code size growth (~15 new files) |
| 6.1 | **Critical** | `server/claude/v1/analyze.ts` | JP 3-60 pipeline latency underspecified (single vs. 6 calls) |
| 6.2 | Medium | `server/trajectory/v1/` | Trajectory history can return unbounded data |
| 6.3 | Medium | `server/govdata/v1/` | NOTAM handler assumes incorrect API response format |
| 7.1 | High | Frontend trajectory panel | Trajectory time-slider data unbounded in browser memory |
| 7.2 | Medium | `src/services/social/index.ts` | Social feed can accumulate unbounded post lists |
| 8.1 | Medium | TikTok handler (planned) | Apify scraper has uncertain reliability |
| 8.2 | Medium | Railway deployment | Railway worker scaling for multiple relay functions |
| 9.1 | Low | Proto build pipeline | Build time impact is negligible |
| 9.2 | Medium | `src/generated/` | Generated code committed creates merge conflict surface |
| 10.1 | High | `src/services/runtime-config.ts` | Feature flag count doubles from 21 to ~32 |
| 10.2 | Medium | `src/services/runtime-config.ts` | Feature flags in localStorage without migration |
| 11.1 | **Critical** | 4 core files | High merge conflict surface in actively developed upstream files |
| 11.2 | Low (+) | `proto/worldmonitor/*/v1/` | Proto namespace isolation is correct (good) |
| 11.3 | Low (+) | `api/*/` | API route directories do not conflict (good) |

### Priority Action Items

**Must fix before implementation:**
1. **[Critical 1.2 + 6.1]** Resolve JP 3-60 pipeline design discrepancy. Decide single-call vs. multi-call and implement accordingly with proper timeout handling.
2. **[Critical 2.1]** Increase Claude cache TTLs and add Redis deduplication to prevent cost overrun.
3. **[Critical 11.1]** Minimize upstream conflict surface by using additive modifications (prepend, not replace) and comment delimiters.
4. **[High 3.3]** Add server-side timeouts and fallback to Claude handlers.

**Should fix during implementation:**
5. **[High 2.2]** Align dual-layer cache TTLs.
6. **[High 3.1 + 3.2]** Enhance circuit breaker with error classification and per-platform thresholds.
7. **[High 7.1]** Add trajectory data downsampling and memory limits.
8. **[High 10.1]** Group feature flags hierarchically.

**Can fix post-implementation:**
9. **[Medium]** All medium-severity findings (cache invalidation, social feed bounds, generated code strategy, etc.)
