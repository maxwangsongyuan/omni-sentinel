# Omni Sentinel -- Feature Completeness & Feasibility Review

**Reviewer:** Feature Completeness & Feasibility Reviewer (automated)
**Date:** 2026-03-03
**Documents reviewed:**
- Design: `docs/plans/2026-03-03-omni-sentinel-design.md`
- Implementation Plan: `docs/plans/2026-03-03-omni-sentinel-implementation.md`
- Existing codebase (World Monitor v2.5.24 fork)

---

## Table of Contents

1. [Design-to-Plan Gap Analysis](#1-design-to-plan-gap-analysis)
2. [API Feasibility Assessment](#2-api-feasibility-assessment)
3. [Frontend Feasibility](#3-frontend-feasibility)
4. [Data Format Compatibility](#4-data-format-compatibility)
5. [Missing Features](#5-missing-features)
6. [Existing World Monitor Overlap](#6-existing-world-monitor-overlap)
7. [i18n Completeness](#7-i18n-completeness)
8. [Risk Summary & Recommendations](#8-risk-summary--recommendations)

---

## 1. Design-to-Plan Gap Analysis

### Module 1: Claude AI Provider

| Design Specifies | Plan Covers? | Notes |
|---|---|---|
| `ClaudeService { Summarize, Analyze, Predict }` | PARTIAL | **`Predict` RPC is missing.** The design explicitly lists a `Predict` RPC and `predict.proto` file. The implementation plan only defines `Summarize` and `Analyze`. The `predict.proto` file is not created anywhere in the plan. |
| `AnalystService { RunAssessment, GetPrediction, RunTargetAnalysis }` | PARTIAL | The plan reuses `ClaudeService.Analyze` for JP 3-60 analysis but does NOT create the separate `AnalystService` defined in the design. `RunAssessment`, `GetPrediction`, and `RunTargetAnalysis` are all absent as distinct RPCs. |
| Default model: `claude-sonnet-4-20250514` | YES | Hardcoded in both `summarize.ts` and `analyze.ts`. |
| Settings UI: Claude section in AI settings | NO | The plan does not modify `UnifiedSettings.ts` or `RuntimeConfigPanel.ts` to add a Claude API key input section. Users have no way to configure the key via UI. |
| Replace `summarization.ts` API_PROVIDERS array | YES | Task 1.5 replaces the chain. |
| Remove Ollama/Groq/Browser T5 | PARTIAL | Task 1.5 removes them from the `API_PROVIDERS` array, but the old provider types remain in `SummarizationProvider`. The plan adds `'claude'` to the type but does not remove `'ollama' | 'groq' | 'browser'`. The design says "Remove Ollama/Groq/Browser T5" -- dead code remains. |
| Wire into World Brief, AI Deduction, Headline Memory | NO | The plan only modifies `summarization.ts`. It does NOT update `InsightsPanel.ts` (World Brief), `DeductionPanel.ts` (AI Deduction), `focal-point-detector.ts`, `threat-classifier.ts`, `parallel-analysis.ts`, or any of the other AI-consuming services. These all still use Groq via `server/worldmonitor/intelligence/v1/` handlers which hardcode `GROQ_API_KEY`. |
| OpenRouter as fallback | YES | Kept in the chain. |
| Cache tier: summarize=medium, analyze=slow | YES | Task 1.4 Step 3 adds both. |
| `api/claude/v1/[rpc].ts` edge function | YES | Task 1.4 Step 1. |
| `src/services/claude/` client wrapper | YES | Task 1.4 Step 2. |

**Critical gaps:**
1. `Predict` RPC entirely missing from implementation
2. `AnalystService` (3 RPCs) collapsed into a single `Analyze` RPC -- significant functional loss
3. No UI for configuring Claude API key
4. Existing AI consumers (DeductionPanel, classify-event, risk-scores, country-intel-brief) are not updated to use Claude

### Module 2: Social Media Integration

| Design Specifies | Plan Covers? | Notes |
|---|---|---|
| Reddit RPC | YES | Task 2.2 |
| Twitter/X RPC | YES | Task 2.3 |
| Bluesky RPC | YES | Task 2.3 |
| **TikTok RPC** | **NO** | Design specifies `ListTikTokPosts` via Apify scraper on Railway worker. **Entirely absent from implementation plan.** No proto, no handler, no tiktok.proto. |
| **VK RPC** | **NO** | Design specifies `ListVKPosts` via VK API v5 with service token. **Entirely absent from implementation plan.** No proto, no handler, no vk.proto. |
| `SocialFeedPanel` component | NO | Plan registers the panel key `'social-feed'` in `panels.ts` but does NOT create the actual `SocialFeedPanel.ts` component file. There is no UI implementation for the social feed. |
| Platform filter tabs (All/Reddit/X/Bluesky/TikTok/VK) | NO | No component means no tabs. |
| Geotagged posts on map as new layer | NO | No map layer integration. The `SocialPost` proto has lat/lon fields but no code renders them on the map. No changes to `MapLayers`, `FULL_MAP_LAYERS`, or `DeckGLMap.ts`. |
| Feed into AI Threat Classification pipeline | NO | No integration with `threat-classifier.ts` or `ai-classify-queue.ts`. |
| Monitored sources (specific subreddits, @handles, communities) | YES | Hardcoded in handler files. |
| `TWITTER_BEARER_TOKEN` secret key | PARTIAL | Added to `RUNTIME_FEATURES` but NOT added to `RuntimeSecretKey` type. |

**Critical gaps:**
1. TikTok and VK platforms completely missing (2 of 5 platforms)
2. No actual frontend component created
3. No map layer for geotagged posts
4. No AI pipeline integration

### Module 3: JP 3-60 Analysis Agent

| Design Specifies | Plan Covers? | Notes |
|---|---|---|
| Panel registration + i18n | YES | Task 3.1 |
| Free-text analysis query input | NO | No `AnalystPanel.ts` component is created. Only panel key and i18n strings are added. |
| Structured report with probability dashboard | NO | No component renders the 6-dimension scores, timeline, or confidence levels. |
| History: save and compare past reports | NO | No persistence mechanism for past analysis runs. |
| Cross-reference with Polymarket/Kalshi | NO | No integration between analysis results and prediction market data. |
| Six-step sequential pipeline | PARTIAL | The `analyze.ts` handler does a single Claude call with all six dimensions in one prompt, rather than six sequential calls. This is a reasonable simplification but differs from the design's "each step is a Claude API call with step-specific system prompt." |

**Critical gaps:**
1. No `AnalystPanel.ts` component -- the entire user-facing feature is missing
2. No report history or comparison functionality
3. No prediction market cross-referencing

### Module 4: Government Data Integration

| Design Specifies | Plan Covers? | Notes |
|---|---|---|
| `GovDataService { ListNotams, ListNavtex, ListSanctions }` | PARTIAL | Only `ListNotams` is implemented. **`ListNavtex` and `ListSanctions` RPCs are absent.** |
| NOTAM proto + handler | YES | Task 4.1-4.2 |
| **NAVTEX proto + handler** | **NO** | Design specifies `navtex.proto` and NAVTEX handler. Not in the plan. |
| **Sanctions proto + handler** (OpenSanctions) | **NO** | Design specifies `sanctions.proto` and OpenSanctions integration. Not in the plan. |
| TFR polygon overlays on map | NO | No map integration for NOTAMs/TFRs. |
| Warning zone overlays on map | NO | No NAVTEX map overlays. |
| Entity search panel (Sanctions) | NO | No UI for sanctions search. |
| GovData panel registration | NO | No panel added to `panels.ts` for government data. |
| GovData feature flags | NO | No `RuntimeFeatureId` entries for govdata features. |

**Critical gaps:**
1. NAVTEX and Sanctions -- 2 of 3 data sources missing entirely
2. No map overlays for any government data
3. No panel to display the data

### Module 5: Historical Trajectory Database

| Design Specifies | Plan Covers? | Notes |
|---|---|---|
| `TrajectoryService { QueryFlightHistory, QueryVesselHistory, GetTrajectoryTimelapse }` | PARTIAL | Only `QueryFlightHistory` is implemented. **`QueryVesselHistory` and `GetTrajectoryTimelapse` are absent.** |
| `flight_history.proto` | YES | Task 5.1 |
| **`vessel_history.proto`** | **NO** | AIS vessel history via AISHub not in plan. |
| "View History" button on map aircraft/vessel | NO | No UI integration with existing map popups. No changes to `MapPopup.ts`. |
| Historical track line on map with time slider | NO | No map rendering code for trajectory tracks. No changes to `Map.ts` or `DeckGLMap.ts`. |
| Trajectory panel registration | NO | No panel registered in `panels.ts`. |

**Critical gaps:**
1. Vessel history and timelapse RPC missing
2. No frontend whatsoever -- no button, no map tracks, no time slider

### Module 6: Enhanced Prediction Markets

| Design Specifies | Plan Covers? | Notes |
|---|---|---|
| Kalshi handler | PARTIAL | Task 6.1 creates `list-kalshi-markets.ts` but does NOT define proto messages for Kalshi or add new RPCs to the prediction service proto. The handler is created but has no proto definition to generate server types from. |
| Metaculus handler | PARTIAL | Task 6.1 mentions "Create list-metaculus-questions.ts (similar pattern, Metaculus API)" but provides NO code. |
| Comparison panel: Polymarket vs Kalshi vs Metaculus | NO | No new UI component. Existing `PredictionPanel.ts` only renders Polymarket data. |
| AI prediction vs market prediction comparison | NO | No cross-referencing between `AnalystPanel` output and prediction markets. |
| Divergence highlighting | NO | No "alpha signal" detection when AI and markets disagree. |
| New RPCs added to prediction proto | NO | `proto/worldmonitor/prediction/v1/service.proto` is not modified. |

**Critical gaps:**
1. No proto definitions for Kalshi/Metaculus RPCs
2. No comparison UI
3. Metaculus implementation code completely absent

### Module 7: Expanded RSS News Sources

| Design Specifies | Plan Covers? | Notes |
|---|---|---|
| ISW | NOT IN PLAN | Plan lists ISW in `SOURCE_TIERS` and feed URLs. However, see overlap section below. |
| INSS | NO | Listed in design, absent from plan entirely. |
| IISS | NO | Listed in design, absent from plan entirely. |
| RUSI | ALREADY EXISTS | Already in codebase at line 230 of `feeds.ts`. |
| Al-Monitor | YES | In plan. |
| Middle East Eye | YES | In plan. |
| The Diplomat | ALREADY EXISTS | Already at line 102 and line 683 of `feeds.ts`. |
| Nikkei Asia | ALREADY EXISTS | Already at lines 183, 688 of `feeds.ts`. |
| CSIS | ALREADY EXISTS | Already at lines 113, 618, 866, 1120 of `feeds.ts`. |
| Carnegie | ALREADY EXISTS | Already at lines 116, 621, 1133 of `feeds.ts`. |
| Atlantic Council | ALREADY EXISTS | Already at lines 110, 616, 1127 of `feeds.ts`. |
| Brookings | ALREADY EXISTS | Already in `SOURCE_TIERS` line 115. |
| Chinese: MIIT, MOFCOM, Xinhua | PARTIAL | MIIT and MOFCOM already exist (lines 128-129). Xinhua already exists (line 120). Not in plan. |
| ALLOWED_DOMAINS updates | YES | Plan adds domains to `rss-proxy.js`. |

**Critical gaps:**
1. INSS and IISS feeds are in the design but missing from the plan
2. Many feeds listed in the plan already exist in the codebase (see Overlap section)

### Technical Notes Coverage

| Design Specifies | Plan Covers? |
|---|---|
| Proto workflow (6 steps) | YES -- each module follows the pattern |
| Caching strategy table | PARTIAL -- some tiers added, but prediction market cache tier for Kalshi/Metaculus not added |
| New panel registration in all variant configurations | NO -- panels only added to `FULL_PANELS`, not to `TECH_PANELS`, `FINANCE_PANELS`, etc. |
| i18n for all new UI strings | PARTIAL -- only analyst strings defined; no social, govdata, trajectory, or prediction comparison i18n |

---

## 2. API Feasibility Assessment

### Reddit OAuth2 (Client Credentials Flow)

**Plan approach:** Uses Reddit's public JSON API (`reddit.com/r/{sub}/hot.json`) with `User-Agent` header. Does NOT use OAuth2 at all.

**Feasibility:** MEDIUM RISK
- The design specifies OAuth2 client credentials flow via `oauth.reddit.com`. The plan uses the unauthenticated JSON endpoint instead.
- Reddit's public JSON API works but has aggressive rate limiting (~10 req/min without OAuth, vs 60 req/min with OAuth).
- With 4 subreddits fetched in parallel, each polling cycle uses 4 requests. At 5-min cache, this is fine -- but if cache misses stack up, rate limits will be hit quickly.
- Reddit's `.json` endpoint occasionally returns 429 or requires solving CAPTCHAs from server IPs.
- **Recommendation:** Implement OAuth2 client credentials as designed. It is straightforward (POST to `https://www.reddit.com/api/v1/access_token` with client ID + secret) and gives 6x more headroom.

### X/Twitter API v2 (Bearer Token)

**Feasibility:** HIGH RISK
- **Free tier limitation:** The free tier of X API v2 provides ONLY `POST /2/tweets` (posting) and `DELETE /2/tweets/:id`. It does NOT include search or read endpoints.
- **Basic tier ($100/month):** Required for `GET /2/tweets/search/recent`. Limited to 10,000 tweets/month and 60 requests/15-min. Search only covers the last 7 days.
- **Pro tier ($5,000/month):** Required for full-archive search and higher volume.
- The plan uses `GET /2/tweets/search/recent` which requires at minimum the Basic tier.
- The `from:` operator query construction (combining 4+ accounts with `OR`) is valid syntax.
- `tweet.fields=geo` requires the user to have enabled location sharing -- very few users do. Geotagging will return empty for nearly all tweets.
- **Recommendation:** Budget for Basic tier ($100/mo) or consider Nitter/third-party scraping as a fallback. Document that geo data will be sparse.

### Bluesky AT Protocol

**Feasibility:** LOW RISK -- Good
- `app.bsky.feed.searchPosts` is a real, publicly accessible endpoint at `https://public.api.bsky.app/xrpc/`.
- No authentication required for public search.
- The API is stable and well-documented.
- Rate limits are generous (3000 req/5min for unauthenticated).
- Response format matches what the plan expects (`posts[].record.text`, `posts[].author.handle`).
- **One issue:** The `limit` parameter maximum is 25 (not 100 as the plan assumes). The plan passes `Math.min(limit, 100)` but the actual cap is 25.
- **Recommendation:** Fix limit cap to 25. Otherwise, this integration is feasible as designed.

### TikTok via Apify

**Feasibility:** NOT ASSESSED -- Missing from plan entirely.
- Apify TikTok scrapers exist (e.g., `clockworks/tiktok-scraper`) and cost ~$0.25-$0.50 per 1000 results.
- Data freshness depends on scraper run frequency (typically 1-5 minutes).
- Apify provides a REST API for triggering runs and reading results.
- TikTok frequently changes their anti-scraping measures, so reliability is MODERATE.
- Geotagging on TikTok requires parsing video metadata -- complex and unreliable.
- **Recommendation:** When implementing, use Apify's actor webhook pattern rather than polling.

### VK API v5

**Feasibility:** NOT ASSESSED -- Missing from plan entirely.
- VK API v5 with service token provides access to `wall.get` and `wall.search` for public groups.
- Service tokens are obtained from VK developer settings (no user auth needed).
- Rate limit: 5 requests/second with service token.
- Content is primarily in Russian -- need to consider translation pipeline.
- VK may block requests from non-Russian IPs.
- **Recommendation:** When implementing, add IP geolocation awareness and translation support.

### FAA NOTAM API

**Feasibility:** MEDIUM RISK
- The plan uses `https://external-api.faa.gov/notamapi/v1/notams` with a `client_id` header.
- The FAA NOTAM API requires registration at `https://api.faa.gov/` to obtain a `client_id` and `client_secret`.
- The API is publicly accessible after registration (free for non-commercial use).
- Response format is GeoJSON when `responseFormat=geoJson` is specified.
- **Issue with plan's parsing:** The plan accesses `props?.coreNOTAMData?.notam?.id` but the actual FAA NOTAM API GeoJSON response structure uses a different nesting (`properties.coreNOTAMData.notam` does exist but field names vary between API versions). Testing against the live API is essential.
- **Note:** The existing codebase already uses ICAO NOTAMs for airport closure detection (`server/worldmonitor/aviation/v1/_shared.ts` lines 334-457). The design adds FAA NOTAMs as a separate data source focused on TFR polygons, which is complementary.
- **Recommendation:** Feasible but needs live API testing for response format validation.

### NGA MSI (NAVTEX / Navigational Warnings)

**Feasibility:** ALREADY EXISTS
- The existing codebase already has `list-navigational-warnings.ts` calling `https://msi.nga.mil/api/publications/broadcast-warn?output=json&status=A`.
- This IS the NGA MSI API that the design references for NAVTEX.
- The existing implementation already parses NGA's broadcast warnings and serves them via the maritime service proto.
- **The design's "NAVTEX" feature largely duplicates existing functionality.** The main gap is map overlay rendering (existing code fetches data but does not draw polygons on the map).
- **Recommendation:** Do NOT create a separate `navtex.proto` in govdata. Instead, enhance the existing maritime navigational warnings with map overlay rendering.

### OpenSanctions API

**Feasibility:** MEDIUM RISK -- Not in plan.
- OpenSanctions provides a free API at `https://api.opensanctions.org/`.
- Search endpoint: `GET /search/default?q={query}` -- no auth required for basic queries.
- Bulk data requires API key (free tier: 500 requests/day).
- Response format is JSON with entity schema (name, countries, datasets, properties).
- **Recommendation:** Feasible for basic entity search. Free tier adequate for typical usage patterns.

### OpenSky Historical Data (Impala DB)

**Feasibility:** HIGH RISK
- The plan uses `https://opensky-network.org/api/tracks/all?icao24={icao}&time={begin}`.
- This endpoint returns the track of a single flight, NOT historical positional data over a time range.
- The `tracks/all` endpoint only works for flights within the last 30 days.
- The `time` parameter specifies a Unix timestamp to find the flight nearest to that time -- it does NOT return all flights in a range.
- For true historical trajectory data, you need the Impala shell (`trino.opensky-network.org`), which requires academic registration approved by OpenSky Network administrators.
- The REST API has rate limits of ~100 requests/day for unauthenticated and ~1000/day for registered users.
- **Recommendation:** The plan's approach will work for recent single-flight tracks but NOT for the "historical trajectory database" envisioned in the design. For proper historical data, either apply for Impala access or use a proxy/caching strategy.

### Kalshi API

**Feasibility:** MEDIUM RISK
- The plan uses `https://api.elections.kalshi.com/trade-api/v2/markets`.
- Kalshi's public API endpoint is `https://api.elections.kalshi.com/trade-api/v2` (correct).
- **Market listing does NOT require authentication** for read-only access.
- The `last_price` field exists but is in cents (0-100), not a fraction. The plan divides by 100 which produces a 0-1 probability -- correct.
- `series_ticker` filter parameter is valid.
- Kalshi's API documentation is well-maintained.
- **Issue:** Kalshi is US-only and may block non-US IP addresses. Vercel edge functions run globally -- need to ensure the function runs in a US region.
- **Recommendation:** Pin the edge function to `iad1` (US East) region. Otherwise feasible.

### Metaculus API

**Feasibility:** MEDIUM RISK -- No code provided.
- Metaculus does have a public API at `https://www.metaculus.com/api2/`.
- Key endpoints: `GET /api2/questions/` (list), `GET /api2/questions/{id}/` (detail).
- No authentication required for public questions.
- Response includes `community_prediction` (probability) and `resolution` fields.
- API is undocumented/semi-official -- endpoints may change without notice.
- **Recommendation:** Feasible but fragile. Document API endpoints and add version detection.

---

## 3. Frontend Feasibility

### SocialFeedPanel: Can a Single Panel Handle 5 Data Formats?

**Assessment:** Feasible with the unified `SocialPost` type, BUT significant work is not in the plan.

- The `SocialPost` proto normalizes all platforms to common fields. This works for basic display.
- Platform-specific features ARE lost (see Data Format Compatibility below).
- The plan references creating a panel "similar to existing `TelegramIntelPanel`" which has filter tabs. This pattern is proven in the codebase.
- **Missing:** The actual `SocialFeedPanel.ts` component file. The `TelegramIntelPanel.ts` pattern (132 lines) would need to be extended to ~250-350 lines to handle:
  - 6 filter tabs (All + 5 platforms)
  - Platform-specific styling (Reddit scores, Twitter engagement, Bluesky reposts)
  - Loading/error states per platform (one may fail while others succeed)
  - Engagement sort vs chronological sort toggle
- **Recommendation:** Create the component. Use the `TelegramIntelPanel` as a template. The architecture is sound.

### AnalystPanel: UX During ~30s Wait

**Assessment:** Needs careful UX design not addressed in the plan.

- A single Claude API call for analysis will take 10-30 seconds depending on prompt complexity and model load.
- The plan provides i18n strings `"analyzing": "Analyzing..."` but no streaming or progressive UI.
- **Existing pattern:** `DeductionPanel.ts` already handles a similar flow (submit query, wait for Groq response, render result). It shows a loading state during the API call.
- **Missing from plan:**
  - Streaming response (Claude supports streaming via SSE; the plan uses a single request/response)
  - Progress indicators for each of the 6 dimensions
  - Cancel/abort mechanism
  - Error recovery
- **Recommendation:** At minimum, copy the `DeductionPanel` pattern. For a better UX, implement Claude's streaming API to show dimensions as they are analyzed. This would require changing the edge function to support SSE.

### Trajectory Timelapse: MapLibre Track Rendering

**Assessment:** Feasible but substantial map integration work is not in the plan.

- MapLibre GL JS supports `LineString` GeoJSON layers natively -- track rendering is straightforward.
- Time slider would require a custom UI component + filtering the track points by time range.
- The existing codebase (`DeckGLMap.ts` at 187KB, `Map.ts` at 134KB) has extensive map rendering infrastructure. Adding a track layer follows existing patterns.
- `MapPopup.ts` (123KB) already handles click interactions on map objects -- adding a "View History" button is feasible.
- **OpenSky data format issue:** The `tracks/all` endpoint returns `path: [[time, lat, lon, altitude, heading], ...]` which maps directly to `TrajectoryPoint`. However, resolution is ~10 second intervals for a single flight, which may produce jerky track lines for short flights.
- **Missing from plan:** All map rendering code, time slider component, MapPopup integration.

### Prediction Comparison: Three Market APIs

**Assessment:** Data formats are comparable but normalization needs work.

- Polymarket: `yesPrice` (0-1 probability), `volume` (USD), `title`
- Kalshi: `last_price` (cents 0-100), `volume` (contracts), `title`
- Metaculus: `community_prediction` (0-1 probability), no volume equivalent, `title`
- Key differences:
  - Volume units differ (USD vs contracts vs none)
  - Probability scales differ (Polymarket 0-1, Kalshi 0-100 cents)
  - Question matching across platforms is non-trivial (same event may have different titles)
- **Recommendation:** Normalization to a common format is feasible. Cross-platform question matching will need fuzzy string matching or manual mapping of equivalent questions.

---

## 4. Data Format Compatibility

### Unified `SocialPost` Type -- Field Coverage

```
SocialPost fields:        Reddit    Twitter    Bluesky    TikTok*    VK*
-------------------------------------------------------------------
id                        YES       YES        YES        -          -
platform                  YES       YES        YES        -          -
author                    YES       PARTIAL    YES        -          -
text                      YES       YES        YES        -          -
url                       YES       YES        YES        -          -
timestamp                 YES       YES        YES        -          -
engagement                YES       YES        YES        -          -
latitude                  NO(1)     RARE(2)    NO(3)      -          -
longitude                 NO(1)     RARE(2)    NO(3)      -          -
topic                     YES       STATIC     STATIC     -          -
tags                      YES       STATIC     STATIC     -          -
```

\* TikTok and VK not implemented, so not assessed.

**Platform-specific features being lost:**

1. **Reddit:**
   - `selftext` (post body) -- only title is captured
   - `num_comments` -- not captured
   - `subreddit_subscribers` -- useful for source credibility
   - `link_flair_text` -- useful for categorization
   - `is_self` vs link post distinction
   - `thumbnail` / `preview` images

2. **Twitter:**
   - `author_id` is captured but NOT resolved to `@username` (would need a separate `/2/users` API call)
   - `referenced_tweets` (retweets, quote tweets) -- not captured
   - `entities.urls`, `entities.mentions`, `entities.hashtags` -- not captured
   - `context_annotations` -- Twitter's own topic classification, lost
   - Media attachments (images, videos)

3. **Bluesky:**
   - `embed` data (quoted posts, images, external links) -- not captured
   - `labels` (content moderation labels) -- not captured
   - `reply` context (parent post) -- not captured
   - `facets` (rich text annotations like mentions, links) -- not captured

**Notes:**
- (1) Reddit posts never have geolocation
- (2) Twitter geo requires user opt-in; <1% of tweets have it
- (3) Bluesky has no geolocation in post schema

**Recommendation:** The unified type is acceptable for v1 but consider adding an `extra` or `metadata` JSON field to preserve platform-specific data for future use.

---

## 5. Missing Features

### 5.1 Error States and Loading States

**Status: NOT ADDRESSED for any new panel.**

Every new panel needs:
- Loading skeleton/spinner on initial fetch
- Error message on API failure (with retry button)
- Graceful degradation when API key is missing

Existing panels use `Panel.showLoading()`, `Panel.showError()`, and `Panel.setContent()`. The plan creates no components, so none of these states are handled.

**Impact:** Users will see blank panels with no feedback.

### 5.2 Empty States

**Status: NOT ADDRESSED.**

Each panel needs "no data" messaging:
- Social feed: "No posts found. Check your API keys in Settings."
- Analyst: "Enter a query to begin analysis" (i18n key exists: `analyst.noResults`)
- NOTAM: "No active flight restrictions"
- Trajectory: "Click an aircraft on the map to view flight history"
- Predictions: "No matching markets found"

Only the analyst `noResults` string is defined.

### 5.3 Pagination

**Status: NOT ADDRESSED.**

- **Reddit:** The plan fetches up to `limit` posts per subreddit but does not handle Reddit's `after` cursor for loading more. Reddit returns max 100 items per request.
- **Twitter:** `GET /2/tweets/search/recent` returns a `next_token` for pagination. The plan ignores it, limiting results to a single page (max 100 tweets).
- **Bluesky:** `searchPosts` returns a `cursor` field for pagination. Ignored.
- **Kalshi:** Returns paginated results. Ignored.
- **Metaculus:** Returns paginated results. Not implemented at all.

**Impact:** Users will only see the first page of results from each platform.

### 5.4 Real-time Updates vs Polling

**Status: NOT ADDRESSED.**

The design does not specify a refresh mechanism. The caching tiers imply polling:
- Social media: 1-5 min refresh
- NOTAMs: 15 min refresh
- Predictions: 2 min refresh

The existing codebase uses a `RefreshScheduler` pattern (visible in `TelegramIntelPanel.refresh()`). New panels need to be wired into this scheduler.

**Missing:** No code registers new panels with the refresh scheduler or `DataLoader`.

### 5.5 Offline/Degraded Mode

**Status: NOT ADDRESSED.**

The plan uses `createCircuitBreaker` for all new services, which provides:
- Circuit breaking (stop calling failed APIs)
- Cache fallback (return last good response)
- This is adequate for degraded mode.

However, no offline detection or offline messaging is added.

### 5.6 Map Layer Integration for Geotagged Social Posts

**Status: NOT ADDRESSED.**

The design explicitly states: "Geotagged posts appear on map as a new layer."

Required changes not in plan:
- Add `socialPosts: false` to all `MapLayers` definitions in `panels.ts`
- Add social post layer rendering to `DeckGLMap.ts` or `Map.ts`
- Add toggle UI for the social layer
- Add to `LAYER_TO_SOURCE` mapping

---

## 6. Existing World Monitor Overlap

### 6.1 AI Summarization (Groq/OpenRouter)

**Overlap:** SIGNIFICANT

The existing codebase has a complete AI summarization pipeline:
- `src/services/summarization.ts` -- Fallback chain: Ollama -> Groq -> OpenRouter -> Browser T5
- `server/worldmonitor/news/v1/summarize_article.proto` -- Existing summarization RPC
- `server/worldmonitor/intelligence/v1/deduct-situation.ts` -- Uses Groq directly
- `server/worldmonitor/intelligence/v1/classify-event.ts` -- Uses Groq directly
- `server/worldmonitor/intelligence/v1/get-risk-scores.ts` -- Uses Groq directly

**Issue:** The plan creates a NEW Claude proto service with its own `Summarize` RPC rather than extending the existing `SummarizeArticle` RPC. This means:
- Two parallel summarization systems will coexist
- The existing `InsightsPanel` will continue using Groq (via the old SummarizeArticle RPC) even after Claude is added
- `classify-event.ts`, `deduct-situation.ts`, `get-risk-scores.ts`, and `get-country-intel-brief.ts` all hardcode `GROQ_API_KEY` and will NOT use Claude

**Recommendation:** Instead of a separate Claude service, add Claude as a provider in the existing `SummarizeArticle` RPC and update the intelligence handlers to accept a configurable LLM provider.

### 6.2 Telegram Integration

**Overlap:** NONE -- Complementary

The existing Telegram integration (`telegram-intel.ts`, `TelegramIntelPanel.ts`) fetches from a Railway-hosted Telegram relay. The new social media service targets Reddit/Twitter/Bluesky/TikTok/VK. These are distinct platforms.

The `SocialFeedPanel` pattern is modeled after `TelegramIntelPanel`, which is appropriate.

### 6.3 RSS Feeds

**Overlap:** SIGNIFICANT

The following feeds from the implementation plan **already exist** in `src/config/feeds.ts`:

| Feed | Already Exists At |
|---|---|
| RUSI | Line 230, 629-630, 1136 |
| The Diplomat | Line 102, 683 |
| Nikkei Asia | Line 183, 688 |
| CSIS | Line 113, 618, 866, 1120 |
| Carnegie | Line 116, 621, 1133 |
| Atlantic Council | Line 110, 616, 1127 |
| Brookings | Line 115 (SOURCE_TIERS only -- no feed URL) |
| Xinhua | Line 120 |
| MIIT (China) | Line 128 |
| MOFCOM (China) | Line 129 |

**Actually new feeds from the plan:**
- ISW (`understandingwar.org`)
- Al-Monitor
- Middle East Eye

**Feeds in design but missing from both codebase AND plan:**
- INSS (Institute for National Security Studies)
- IISS (International Institute for Strategic Studies)
- Stars and Stripes (mentioned in plan SOURCE_TIERS but no URL)

**Recommendation:** Remove already-existing feeds from the plan. Add actually missing feeds (ISW, Al-Monitor, Middle East Eye, INSS, IISS). Check if Brookings needs a feed URL added.

### 6.4 Polymarket (Prediction Markets)

**Overlap:** SIGNIFICANT

The existing codebase has a comprehensive Polymarket integration:
- `src/services/prediction/index.ts` (17,803 bytes) -- Full Polymarket client with:
  - Multiple fetch strategies (direct browser, Vercel proxy, Railway proxy, Sebuf RPC)
  - Country-specific market filtering
  - Event tag filtering
  - Tauri desktop support
- `server/worldmonitor/prediction/v1/` -- Server-side Polymarket handler
- `src/components/PredictionPanel.ts` -- UI with yes/no bars, volume, close dates
- `proto/worldmonitor/prediction/v1/` -- Proto definitions

The plan extends prediction markets with Kalshi and Metaculus but does NOT modify the existing proto or panel. This means:
- The new Kalshi/Metaculus handlers will have no proto types (the plan creates handler files but no `.proto` definitions)
- The existing `PredictionPanel` will not show Kalshi/Metaculus data
- No comparison view

**Recommendation:** Extend the existing `prediction/v1/service.proto` with new RPCs. Extend `PredictionPanel` to show multiple platforms.

### 6.5 Navigational Warnings (NGA MSI)

**Overlap:** COMPLETE DUPLICATION

The existing codebase already has:
- `proto/worldmonitor/maritime/v1/list_navigational_warnings.proto` -- Full proto definition
- `server/worldmonitor/maritime/v1/list-navigational-warnings.ts` -- Handler calling `msi.nga.mil` API
- `proto/worldmonitor/maritime/v1/vessel_snapshot.proto` -- `NavigationalWarning` message type

The design proposes creating a new `navtex.proto` under `govdata/v1/` which would be a complete duplication of this existing service.

**Recommendation:** Do NOT create a separate NAVTEX service. The existing maritime navigational warnings service is the NAVTEX equivalent. If map overlays are needed, add them to the existing maritime service.

### 6.6 NOTAM / Airport Closures

**Overlap:** PARTIAL

The existing codebase has:
- `server/worldmonitor/aviation/v1/_shared.ts` lines 334-457 -- ICAO NOTAM closure detection
- Feature flag: `icaoNotams` already registered
- Secret: `ICAO_API_KEY` already registered

However, the existing NOTAM integration focuses narrowly on airport closures (Q-code filtering for closure-type NOTAMs). The design proposes broader NOTAM/TFR monitoring via the FAA API, which adds:
- TFR (Temporary Flight Restriction) polygon data
- Map overlay rendering of TFRs
- Broader NOTAM types beyond closures

**This is complementary, not duplicative**, but the plan should acknowledge the existing NOTAM infrastructure.

---

## 7. i18n Completeness

### Strings Defined in Plan

Only the `analyst` section is defined (Task 3.1):
```json
"analyst": {
  "title", "placeholder", "analyze", "analyzing",
  "dimensions", "probability", "confidence", "timeframe",
  "noResults", "error"
}
```

### Missing i18n Strings

**Social Feed Panel:**
- `panels.socialFeed` (panel title)
- `components.social.filterAll`, `components.social.filterReddit`, `components.social.filterTwitter`, `components.social.filterBluesky`, `components.social.filterTiktok`, `components.social.filterVk`
- `components.social.loading`, `components.social.empty`, `components.social.error`
- `components.social.infoTooltip`
- `components.social.engagement`, `components.social.timeAgo`

**Government Data Panel:**
- `panels.govdata` (panel title)
- `components.govdata.notamTab`, `components.govdata.navtexTab`, `components.govdata.sanctionsTab`
- `components.govdata.loading`, `components.govdata.empty`, `components.govdata.error`
- `components.govdata.infoTooltip`
- `components.govdata.effectiveFrom`, `components.govdata.effectiveTo`, `components.govdata.radius`

**Trajectory Panel:**
- `components.trajectory.viewHistory`, `components.trajectory.loading`, `components.trajectory.noData`
- `components.trajectory.timeSlider`, `components.trajectory.altitude`, `components.trajectory.speed`

**Prediction Comparison:**
- `components.predictions.comparison`, `components.predictions.kalshi`, `components.predictions.metaculus`
- `components.predictions.divergence`, `components.predictions.aiPrediction`

**Claude Settings:**
- `settings.claude.title`, `settings.claude.apiKey`, `settings.claude.model`
- `settings.claude.description`, `settings.claude.testConnection`

**Estimated missing strings:** ~40-50 i18n keys not defined.

---

## 8. Risk Summary & Recommendations

### Severity Ratings

| Issue | Severity | Category |
|---|---|---|
| TikTok and VK platforms entirely missing | HIGH | Feature gap |
| No frontend components created (SocialFeedPanel, AnalystPanel, GovDataPanel) | CRITICAL | Feature gap |
| No map integration for any new feature | HIGH | Feature gap |
| NAVTEX duplicates existing maritime navigational warnings | MEDIUM | Duplication |
| Multiple RSS feeds already exist | LOW | Duplication |
| `Predict` RPC and `AnalystService` missing | HIGH | Feature gap |
| Twitter API requires paid tier ($100/mo) | MEDIUM | Feasibility |
| OpenSky historical API limited to single-flight tracks | MEDIUM | Feasibility |
| Kalshi/Metaculus have no proto definitions | HIGH | Structural gap |
| No i18n for ~40-50 new UI strings | MEDIUM | Completeness |
| Existing AI consumers not updated to use Claude | HIGH | Integration gap |
| No panel refresh/DataLoader integration | MEDIUM | Feature gap |
| No pagination for any API | MEDIUM | Feature gap |
| Bluesky limit cap wrong (25, not 100) | LOW | Bug |

### Top 10 Recommendations

1. **Create frontend components.** The plan is backend-heavy. Without `SocialFeedPanel.ts`, `AnalystPanel.ts`, and a prediction comparison component, users will see registered panels with no content. This is the single largest gap.

2. **Unify AI provider strategy.** Instead of a separate Claude service, add Claude as a provider option in the existing `SummarizeArticle` RPC and update intelligence handlers. This avoids two parallel AI systems.

3. **Add TikTok and VK implementations.** These are 2 of 5 planned social platforms. If timeline is tight, stub them with clear TODO markers rather than silently omitting.

4. **Extend existing prediction proto** rather than creating orphaned handler files. Add `ListKalshiMarkets` and `ListMetaculusQuestions` RPCs to `prediction/v1/service.proto`.

5. **Do not duplicate NGA navigational warnings.** The maritime service already provides this. Enhance the existing implementation with map overlay rendering instead.

6. **Remove already-existing RSS feeds from the plan.** RUSI, The Diplomat, Nikkei Asia, CSIS, Carnegie, Atlantic Council, Xinhua, MIIT, MOFCOM are already in the codebase.

7. **Add the `Predict` RPC and `AnalystService`** as designed, or explicitly document the simplification as a design change.

8. **Add Claude to Settings UI.** Without a configuration panel, users cannot enter their Claude API key. Add to `UnifiedSettings.ts` or `RuntimeConfigPanel.ts`.

9. **Wire new panels into DataLoader and RefreshScheduler.** Without this, new panels will never auto-refresh.

10. **Define all i18n strings upfront.** Missing translations will cause raw key strings to appear in the UI.

### Implementation Effort Estimate (Gaps Only)

| Gap | Estimated Effort |
|---|---|
| SocialFeedPanel component | 4-6 hours |
| AnalystPanel component | 6-8 hours |
| TikTok + VK handlers + protos | 4-6 hours |
| Prediction comparison panel | 4-6 hours |
| Map layers (social, NOTAM, trajectory) | 8-12 hours |
| Kalshi/Metaculus proto + handler fixes | 2-3 hours |
| Settings UI for Claude | 2-3 hours |
| Update existing AI consumers for Claude | 4-6 hours |
| i18n strings | 1-2 hours |
| DataLoader/RefreshScheduler wiring | 2-3 hours |
| **Total additional effort** | **~37-55 hours** |

---

*End of review.*
