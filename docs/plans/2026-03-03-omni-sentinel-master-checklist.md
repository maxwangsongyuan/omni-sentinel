# Omni Sentinel — Master Checklist

**Date:** 2026-03-03
**Status:** Draft — pending owner review
**Source:** 5 specialist reviews + 1 synthesis critique + global platform research

> This is the single source of truth for all findings, decisions, and action items.
> Come back here before implementation to ensure nothing is missed.

---

## Quick Reference

| Document | Path |
|----------|------|
| Design doc (approved) | `docs/plans/2026-03-03-omni-sentinel-design.md` |
| Implementation plan v2 (revised) | `docs/plans/2026-03-03-omni-sentinel-implementation-v2.md` |
| Security review | `docs/reviews/security-review.md` |
| Scalability review | `docs/reviews/scalability-review.md` |
| Cost review | `docs/reviews/cost-review.md` |
| Feature completeness review | `docs/reviews/feature-review.md` |
| Ops & reliability review | `docs/reviews/ops-review.md` |
| Synthesis critique | `docs/reviews/synthesis-critique.md` |
| Global platform research | `docs/research/global-platform-map.md` |

---

## Owner Decisions (Override Review Recommendations)

These are the owner's explicit decisions that override reviewer recommendations:

| Decision | Review Said | Owner Said | Note |
|----------|------------|------------|------|
| **Keep Twitter/X** | Cut from MVP ($200/mo) | Keep it — fastest news source | Accept cost; build it, decide usage later |
| **Keep all features** | Cut ~40% scope | Build everything | AI agents do the work in parallel worktrees |
| **Platform selection** | Pick a few platforms | Research by country/region first | Global platform map created (see below) |
| **Execution approach** | Sequential phased rollout | Parallel worktrees, each module independent | AI agents handle workload |

---

## A. Platform Integration Priority (From Global Research)

### Tier 1 — Must Integrate

| # | Platform | Countries in Top 3 | API | Cost | Status |
|---|----------|-------------------|-----|------|--------|
| 1 | Telegram | 35+ | Free (Telethon) | $0 | Already in upstream |
| 2 | X/Twitter | 25+ | $100-200/mo official | $200/mo | In original plan |
| 3 | YouTube | 80+ | Free (Data API) | $0 | **NEW — add to plan** |
| 4 | Facebook | 120+ | Partial (Meta Content Library) | $0 (researcher) | **NEW — research feasibility** |

### Tier 2 — High Priority

| # | Platform | Countries in Top 3 | API | Cost | Status |
|---|----------|-------------------|-----|------|--------|
| 5 | Reddit | US/Anglosphere | Free (OAuth) | $0 | In original plan |
| 6 | Bluesky | Growing | Free (AT Protocol) | $0 | In original plan |
| 7 | VK | 2 (Russia, Belarus) | Free | $0 | In original plan |
| 8 | TikTok | 15+ | Research API (apply) | Apify $$ | In original plan |
| 9 | Instagram | 40+ | Partial (Meta API) | $0 | **NEW — consider** |

### Tier 3 — Regional Essentials

| # | Platform | Key Countries | API | Status |
|---|----------|--------------|-----|--------|
| 10 | LINE | Japan, Taiwan, Thailand | Partial | **NEW — v2** |
| 11 | Weibo | China | Partial (Chinese reg) | **NEW — v2** |
| 12 | KakaoTalk | South Korea | Partial | **NEW — v2** |
| 13 | Naver | South Korea | Partial | **NEW — v2** |
| 14 | PTT | Taiwan | Scraping only | **NEW — v2** |

### Tier 4 — Monitor But Hard to Integrate (No API)

| Platform | Countries | Challenge |
|----------|----------|-----------|
| WhatsApp | 65+ | No API, E2E encrypted |
| WeChat | China | Chinese phone required, censored |
| Snapchat | Gulf states | No content API, ephemeral |
| Viber | Belarus, Balkans | No public API |
| Douyin | China | Separate from TikTok, Chinese access needed |

### Regional Clusters (for search/monitoring strategy)

| Cluster | Core Platforms | Countries |
|---------|--------------|-----------|
| Telegram-dominant | Telegram | Russia, Ukraine, Belarus, Iran, Syria, Ethiopia |
| Facebook-is-internet | Facebook | Philippines, Myanmar, Sub-Saharan Africa, Haiti |
| WhatsApp-first | WhatsApp → Facebook/YouTube overflow | Brazil, India, Indonesia, Nigeria, Latin America |
| WeChat ecosystem | WeChat/Weibo/Douyin | China mainland |
| Super App | LINE/KakaoTalk | Japan, South Korea, Taiwan, Thailand |
| Twitter-centric | X/Twitter | USA, UK, Japan, Kenya, Saudi Arabia |
| YouTube-as-news | YouTube | Egypt, Jordan, Lebanon, France, Germany |
| Gulf Snapchat | Snapchat | Saudi, Qatar, UAE, Kuwait, Bahrain |
| VPN-dependent | Various via VPN | Iran, China, North Korea, Turkmenistan |
| Viber Belt | Viber | Belarus, Bulgaria, Greece, Serbia, Ukraine |

---

## B. P0 — Blocks Launch (Must Do Before Any Feature Code)

- [ ] **P0-1** Reddit handler must use OAuth2 client credentials (not unauthenticated JSON) `[2h]` — *4 reviewers flagged*
- [ ] **P0-2** Claude endpoints: add cost-proportional rate limiting (10-20 req/min/IP) + daily budget cap `[2h]` — *4 reviewers flagged*
- [ ] **P0-3** Clarify API key storage: server-side `process.env` ONLY, remove `localStorage` reference from design doc `[30m]`
- [ ] **P0-4** Create minimum viable frontend components (SocialFeedPanel, AnalystPanel) — backend without frontend is useless `[6-8h]`
- [ ] **P0-5** Input validation utility: `validateStringParam(value, maxLength, pattern?)` for subreddit names, icao24, Twitter accounts, Bluesky query `[30m]`
- [ ] **P0-6** Claude response validation: JSON extraction (strip code fences), schema validation, HTML sanitization (use existing DOMPurify) `[1h]`
- [ ] **P0-7** Create `.gitattributes` with merge strategies for generated code + lock files `[30m]` — *promoted from P3-12*
- [ ] **P0-8** Pre-create ALL sentinel feature IDs, panel registrations, and gateway cache entries in Module 0 (placeholders for parallel modules) `[2h]`
- [ ] **P0-9** Create `sentinel-en.json` for i18n (avoid editing upstream's 2300-line `en.json`) `[1h]`

**Total P0 effort: ~16-18 hours**

---

## C. P1 — Must Fix Before Production

- [ ] **P1-1** Unit tests for ALL new handlers (minimum 7 test files, TDD approach) `[16h]`
- [ ] **P1-2** ~~Drop Twitter from MVP~~ → **OVERRIDDEN: Keep Twitter** (owner decision)
- [ ] **P1-3** Increase Claude cache TTLs: Summarize → 15min, Analyze → 30min + add Redis dedup `[2h]`
- [ ] **P1-4** Minimize upstream merge conflicts: prepend Claude to `API_PROVIDERS` (don't replace), extract Sentinel config to separate files `[3h]`
- [ ] **P1-5** Content sanitization for SocialFeedPanel: textContent only, sanitizeUrl, server-side truncation `[2h]`
- [ ] **P1-6** Keep Browser T5 as last-resort fallback: chain = Claude → OpenRouter → Browser T5 (desktop-only) `[30m]`
- [ ] **P1-7** Add error/status fields to Claude response types (distinguish "failed" from "no data") `[1h]`
- [ ] **P1-8** Server-side killswitches: `process.env.MODULE_{NAME}_ENABLED` check in each edge function `[3h]`
- [ ] **P1-9** Preact error boundary wrapper for each new panel `[2h]`
- [ ] **P1-10** `.env.example` with all new variables + `.nvmrc` + `generate` script `[1h]`
- [ ] **P1-11** Claude API spend tracking: log token usage per call + Anthropic dashboard alerts at $10/$25/$50 `[4h]`
- [ ] **P1-12** Server-side timeout (15s) + OpenRouter fallback on Claude handlers `[2h]`
- [ ] **P1-13** Validate OpenSky icao24 (hex regex) + bounds checking on path array `[30m]`

**Total P1 effort: ~37 hours**

---

## D. P2 — Should Fix

- [ ] **P2-1** Tune circuit breaker thresholds per service `[2h]`
- [ ] **P2-2** Error classification in circuit breaker (only count 5xx/network, not 4xx) `[2h]`
- [ ] **P2-3** Extend existing prediction proto with Kalshi/Metaculus RPCs `[2h]`
- [ ] **P2-4** Remove already-existing RSS feeds from plan; add actually missing ones (INSS, IISS) `[1h]`
- [ ] **P2-5** Fix Bluesky limit cap: 25, not 100 `[1h]`
- [ ] **P2-6** Claude Settings UI (API key input in UnifiedSettings) `[2h]`
- [ ] **P2-7** Wire new panels into DataLoader/RefreshScheduler for auto-refresh `[2h]`
- [ ] **P2-8** `/api/health` endpoint using existing circuit breaker status `[3h]`
- [ ] **P2-9** Align dual-layer cache TTLs (client slightly shorter than CDN) `[2h]`
- [ ] **P2-10** DataFreshnessIndicator component (live/cached/unavailable per panel) `[3h]`
- [ ] **P2-11** Map overlays for NOTAM/TFR data `[8h]`
- [ ] **P2-12** Trajectory map rendering + time slider `[8h]`
- [ ] **P2-13** Define all ~40-50 missing i18n strings `[2h]`
- [ ] **P2-14** Trajectory data downsampling (Ramer-Douglas-Peucker) + memory limits `[2h]`
- [ ] **P2-15** Social feed sliding window (max 100 posts) + deduplication `[2h]`
- [ ] **P2-16** Group feature flags hierarchically with categories/presets `[3h]`
- [ ] **P2-17** Do NOT create separate NAVTEX service — enhance existing maritime warnings `[30m]`

**Total P2 effort: ~45 hours**

---

## E. P3 — Nice to Have

- [ ] **P3-1** Integration tests for external API contracts `[16h]`
- [ ] **P3-2** Manual refresh button per panel `[2h]`
- [ ] **P3-3** Onboarding checklist panel in settings `[4h]`
- [ ] **P3-4** Mock data mode for local development `[8h]`
- [ ] **P3-5** Pin buf CLI version `[30m]`
- [ ] **P3-6** TikTok handler (Apify) `[8h]`
- [ ] **P3-7** VK handler `[8h]`
- [ ] **P3-8** Prediction market comparison panel `[4h]`
- [ ] **P3-9** Update existing AI consumers (DeductionPanel, classify-event, risk-scores) to use Claude `[8h]`
- [ ] **P3-10** Structured logging drain to external service `[4h]`
- [ ] **P3-11** Feature flag localStorage migration with schema versioning `[1h]`
- [x] ~~**P3-12** Generated code merge strategy (.gitignore/.gitattributes) `[2h]`~~ — **PROMOTED to P0-7**
- [ ] **P3-13** Model tiering: Haiku 4.5 for summarization, Sonnet 4 for analysis `[2h]`
- [ ] **P3-14** Anthropic prompt caching for JP 3-60 system prompt `[2h]`
- [ ] **P3-15** Ethical disclaimer on AnalystPanel output `[1h]`
- [ ] **P3-16** LEGAL.md documenting ToS status of each data source `[1h]`

**Total P3 effort: ~72 hours**

---

## F. Architecture Changes (From Reviews)

| # | Change | From | To | Why |
|---|--------|------|----|-----|
| 1 | AI provider chain | Replace `API_PROVIDERS` | Prepend Claude to existing array | Minimize merge conflicts, keep T5 offline fallback |
| 2 | Claude cache TTLs | 5min / 15min | 15min / 30min | Cost + Scalability reviewers agree |
| 3 | Claude models | Sonnet 4 for everything | Haiku for summaries, Sonnet for analysis | 67% cost reduction on summarization |
| 4 | Reddit auth | Unauthenticated JSON | OAuth2 client credentials | All reviewers agree |
| 5 | Config changes | Direct edits to core files | Extract to separate Sentinel config files | Reduce upstream merge conflicts |
| 6 | Error responses | Return empty on failure | Structured error with status field | "0% probability" on failure is dangerous |
| 7 | Bluesky limit | `Math.min(limit, 100)` | `Math.min(limit, 25)` | Actual API limit is 25 |
| 8 | NAVTEX | New `govdata/navtex.proto` | Use existing maritime warnings service | Complete duplication |
| 9 | Deployment | All at once | Phased: RSS → Claude → Social → Analyst → GovData → Prediction → Trajectory | Reduce blast radius |

---

## G. Blind Spots (All Reviewers Missed)

- [ ] **BLIND-1** Legal/ToS compliance: Reddit ToS may prohibit feeding posts to AI; VK requires Russian data law compliance; Twitter has display requirements
- [ ] **BLIND-2** Ethical considerations: dual-use risk, misinformation from AI "probability scores", accountability for wrong analysis
- [ ] **BLIND-3** Data accuracy: LLM hallucination in analysis, unverified social media sources treated equally, stale data not indicated
- [ ] **BLIND-4** Accessibility (a11y): ARIA labels, keyboard navigation, screen reader support for new panels
- [ ] **BLIND-5** Mobile responsiveness: new panels need responsive layouts for small screens
- [ ] **BLIND-6** Slow connections: JP 3-60 analysis takes 10-30s; on 3G could exceed 60s
- [ ] **BLIND-7** User privacy/GDPR: user queries sent to Anthropic API, social media search queries traceable
- [ ] **BLIND-8** End-user documentation: no help system, no tooltips for complex features like JP 3-60 dimensions

---

## H. Cost Estimate

### Monthly Running Cost

| Item | Light | Medium | Heavy |
|------|------:|-------:|------:|
| Claude API (with model tiering + caching) | $5.67 | $15.22 | ~$50+ |
| Vercel (free tier) | $0 | $0 | $0 |
| Railway | $5 | $5 | $5 |
| Upstash Redis (free tier) | $0 | $0 | $0 |
| TwitterAPI.io (adapter pattern) | ~$5 | ~$10 | ~$15 |
| All other APIs | $0 | $0 | $0 |
| **Total** | **~$16** | **~$30** | **~$70+** |

### Key Cost Insight
Using TwitterAPI.io (~$0.15/1K tweets) instead of official X API ($200/mo) reduces total cost by ~90%. Twitter adapter can be swapped via `process.env.TWITTER_ADAPTER` without code changes.

---

## I. Feature Modules (Full Scope — Owner Decision: Build Everything)

### Module 0: Infrastructure Foundation
- [ ] Input validation utility
- [ ] Preact error boundaries
- [ ] Server-side killswitches
- [ ] `.env.example`, `.nvmrc`, `generate` script
- [ ] Sentinel-specific config extraction (avoid core file conflicts)

### Module 1: Claude AI Provider
- [ ] Proto definitions (service.proto, summarize.proto, analyze.proto, predict.proto)
- [ ] Server handlers (summarize.ts, analyze.ts, predict.ts)
- [ ] Edge Function entry point
- [ ] Client wrapper with circuit breaker
- [ ] Rate limiting (10-20 req/min/IP) + daily budget cap
- [ ] Spend tracking (log tokens per call)
- [ ] OpenRouter fallback with 15s timeout
- [ ] Cache TTLs: summarize=15min, analyze=30min
- [ ] Model tiering: Haiku for summaries, Sonnet for analysis
- [ ] Feature flag + killswitch
- [ ] Settings UI (API key input)
- [ ] Unit tests
- [x] **Intelligence Assistant** — IntelChatPanel with 78-tool Claude Sonnet chat loop + automated briefing generation
- [x] **Tavily web search** — `web_search`, `web_extract`, `verify_claim` tools for public internet search and claim verification
- [x] **System prompt** — verification rules (✅ corroborated / ⚠️ unverified / ❌ contradicted) + web search instructions
- [x] **Tests** — 29 unit tests (registry, mock-based scoring logic, API error handling, edge cases)

### Module 2: Social Media Integration
- [ ] Unified `SocialPost` type in common.proto
- [ ] **Reddit** — OAuth2 client credentials, 4 subreddits, input validation
- [ ] **X/Twitter** — Bearer token, monitored accounts + keyword search
- [ ] **Bluesky** — AT Protocol (no auth needed), limit=25
- [ ] **YouTube** — Data API (free), keyword search + channel monitoring (**NEW**)
- [ ] **TikTok** — Apify scraper via Railway worker
- [ ] **VK** — VK API v5, service token, military groups
- [ ] **Facebook** — Meta Content Library API if feasible (**NEW — research**)
- [ ] SocialFeedPanel frontend (copy TelegramIntelPanel pattern)
- [ ] Platform filter tabs: All | Reddit | X | Bluesky | YouTube | TikTok | VK
- [ ] Content sanitization (textContent, sanitizeUrl, truncation)
- [ ] Geotagged posts → map layer
- [ ] Sliding window (max 100 posts in memory) + dedup
- [ ] Per-platform circuit breaker tuning
- [ ] Feature flags + killswitches
- [ ] Unit tests

### Module 3: JP 3-60 Military Analysis Agent
- [ ] Proto definitions (assessment.proto, prediction.proto)
- [ ] Single-call approach (not 6 sequential calls for MVP)
- [ ] JP 3-60 system prompt with 6-dimension scoring
- [ ] ConflictPrediction response type with error/status fields
- [ ] AnalystPanel frontend (copy DeductionPanel pattern)
- [ ] Ethical disclaimer: "AI-generated estimate, not a prediction"
- [ ] DataFreshnessIndicator
- [ ] Prompt caching for system prompt
- [ ] Feature flag + killswitch
- [ ] Unit tests

### Module 4: Government Data
- [ ] **NOTAM** — FAA API + AviationStack, TFR polygon overlays on map
- [ ] **NAVTEX** — DO NOT create new service; enhance existing maritime warnings
- [ ] **Sanctions** — OpenSanctions API, entity search panel
- [ ] Feature flags + killswitches
- [ ] Unit tests

### Module 5: Historical Trajectory Database
- [ ] **Flight history** — OpenSky Impala DB, by ICAO24 + time range
- [ ] **Vessel history** — AISHub (needs hardware, defer details)
- [ ] Map rendering: historical track line
- [ ] Time slider UI
- [ ] Data downsampling (Ramer-Douglas-Peucker) + memory limits
- [ ] icao24 hex validation + path bounds checking
- [ ] Feature flag + killswitch
- [ ] Unit tests

### Module 6: Enhanced Prediction Markets
- [ ] **Kalshi** — Extend existing prediction proto
- [ ] **Metaculus** — Extend existing prediction proto
- [ ] Comparison panel: Polymarket vs Kalshi vs Metaculus (v2 UI)
- [ ] AI-vs-market divergence detection (v2)
- [ ] Feature flags + killswitches
- [ ] Unit tests

### Module 7: Expanded RSS/News
- [ ] Remove already-existing feeds from plan (RUSI, The Diplomat, Nikkei Asia, CSIS, Carnegie, Atlantic Council already exist)
- [ ] Add actually missing: ISW, INSS, IISS, Al-Monitor, Middle East Eye, MIIT, MOFCOM, Xinhua
- [ ] Update `ALLOWED_DOMAINS` in `api/rss-proxy.js`
- [ ] Verify no duplicates with existing `SOURCE_TIERS`

---

## J. Execution Strategy

**Owner's approach:** Multiple worktrees in parallel, each agent handles one module, merge at the end.

### Suggested Worktree Split

| Worktree | Module(s) | Dependencies |
|----------|-----------|-------------|
| `wt-infra` | Module 0 (Infrastructure) | None — do first |
| `wt-claude` | Module 1 (Claude AI) | Module 0 |
| `wt-social` | Module 2 (Social Media) | Module 0 |
| `wt-analyst` | Module 3 (JP 3-60) | Module 0, Module 1 |
| `wt-govdata` | Module 4 (Government Data) | Module 0 |
| `wt-trajectory` | Module 5 (Trajectory) | Module 0 |
| `wt-prediction` | Module 6 (Prediction Markets) | Module 0 |
| `wt-rss` | Module 7 (RSS Expansion) | None |

**Note:** Module 0 (Infrastructure) must complete first since all others depend on it. Module 3 depends on Module 1 (Claude). All others can run in parallel.

---

## K. Devil's Advocate Summary

| Concern | Rebuttal | Mitigation |
|---------|----------|------------|
| Fork = maintenance trap | Extract Sentinel config to separate files, additive modifications | `.gitattributes` merge strategies, proto namespace isolation |
| Market need unclear | Growing OSINT practitioner community needs affordable integrated tools | Phased rollout, measure engagement per feature |
| Building features nobody asked for | Valid concern | Survey World Monitor community before v2 features |
| Maintenance burden unsustainable | Circuit breakers + cache + feature flags reduce operational load | AGPL allows community contribution |
| Could be done simpler | Lacks integration and automation | True for ad-hoc analysis, but Sentinel is for continuous monitoring |

---

## L. Open Questions (Resolve Before Implementation)

- [x] **Twitter API tier**: ~~Basic ($200/mo)~~ → **RESOLVED: Use TwitterAPI.io adapter pattern (~$0.15/1K tweets)**. See `docs/research/twitter-telegram-osint-guide.md`.
- [ ] **Facebook integration**: Is Meta Content Library API accessible for this project? What's the application process?
- [ ] **YouTube scope**: Which channels to monitor? Need a curated list like the Telegram channels.
- [ ] **Reddit ToS**: Does feeding posts to Claude for AI analysis violate Reddit's data terms?
- [ ] **AGPL implications**: Is AGPL the right license if we want government/enterprise users?
- [ ] **Deployment domain**: Custom domain or keep default Vercel URL?
- [ ] **Monitoring**: Sentry (existing) sufficient, or need additional observability?

---

---

## M. Codebase Reality Check (2026-03-04 Review)

Post-review agents actually inspected the codebase and found critical mismatches between plan assumptions and reality:

| # | Assumption | Reality | Impact |
|---|-----------|---------|--------|
| 1 | Components are `.tsx` with Preact JSX | `.ts` files with `Panel` base class + `h()` DOM helper | **BLOCKER** — all frontend code rewritten |
| 2 | Tests use vitest | `node:test` + `node:assert/strict`, `.test.mts` files | **BLOCKER** — all test code rewritten |
| 3 | `panels.ts` exports `PanelConfig[]` | `Record<string, PanelConfig>` keyed by slug | HIGH — merge pattern changed |
| 4 | `RuntimeFeatureId` extensible from external file | Closed TypeScript union type — must edit core file | HIGH — accepted as minimal edit |
| 5 | Proto files are plain proto3 | Require `sebuf.http` annotations (base_path, path, method) | HIGH — all proto code updated |
| 6 | OpenSky Impala DB is REST API | SSH/JDBC only; REST endpoint returns last ~1h only | HIGH — Phase 1 scope reduced |
| 7 | `buf` CLI installed | Not on PATH, requires manual install | HIGH — added to setup |
| 8 | `.env.example` doesn't exist | Already exists (170 lines of upstream config) | MEDIUM — append, not create |
| 9 | Need custom `sanitizeHtml()` | DOMPurify already in `package.json` | MEDIUM — use existing |
| 10 | Prediction proto can be extended | Different market models (binary vs continuous) | MEDIUM — separate protos |

All fixes applied to implementation plan v2 and design doc.

---

*Last updated: 2026-03-04. This checklist consolidates all findings from 6 review agents, global platform research, and 3 post-review codebase verification agents. It is the authoritative reference for implementation planning.*
