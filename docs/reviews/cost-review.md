# Omni Sentinel -- Cost & Resource Review

**Reviewer:** Cost & Resource Reviewer (AI)
**Date:** 2026-03-03
**Documents Reviewed:**
- `docs/plans/2026-03-03-omni-sentinel-design.md`
- `docs/plans/2026-03-03-omni-sentinel-implementation.md`

**Verdict:** The project is viable on free/hobby tiers at light usage but will hit cost walls quickly. The two largest cost drivers are the Claude API and the X/Twitter API. Aggressive caching and model tiering are essential.

---

## Table of Contents

1. [Claude API Costs](#1-claude-api-costs)
2. [Vercel Free Tier Limits](#2-vercel-free-tier-limits)
3. [Railway Costs](#3-railway-costs)
4. [Upstash Redis](#4-upstash-redis)
5. [Third-Party API Free Tiers](#5-third-party-api-free-tiers)
6. [Rate Limit Analysis](#6-rate-limit-analysis)
7. [Cost Optimization Opportunities](#7-cost-optimization-opportunities)
8. [OpenRouter Fallback Costs](#8-openrouter-fallback-costs)
9. [Hidden Costs](#9-hidden-costs)
10. [Break-Even Analysis](#10-break-even-analysis)
11. [Summary & Recommendations](#11-summary--recommendations)

---

## 1. Claude API Costs

### Pricing Basis

The implementation plan specifies `claude-sonnet-4-20250514` (Claude Sonnet 4). Current Anthropic API pricing:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Haiku 4.5 (cheaper alternative) | $1.00 | $5.00 |
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Opus 4 | $15.00 | $75.00 |

**Batch API:** 50% discount on all models.
**Prompt Caching:** Cache reads at 0.1x base price; 5-min cache writes at 1.25x.

### Token Estimates per Call Type

| Operation | Input Tokens (est.) | Output Tokens (est.) | Notes |
|-----------|--------------------:|---------------------:|-------|
| **Summarize** (headlines batch) | ~1,500 | ~500 | 10-20 headlines + system prompt, 2-3 paragraph output |
| **Analyze** (JP 3-60 single step) | ~2,000 | ~1,500 | System prompt + headlines + context, structured JSON output |
| **Analyze** (full 6-step pipeline) | ~12,000 | ~9,000 | 6 sequential Claude calls per analysis |
| **Predict** (scoring) | ~2,000 | ~800 | Dimension scoring with rationale |

### Monthly Cost Estimates -- Claude Sonnet 4

#### Light Usage (10 analyses/day, 50 summaries/day)

| Operation | Calls/Day | Monthly Calls | Input Tokens/Mo | Output Tokens/Mo | Input Cost | Output Cost | **Total** |
|-----------|----------:|-------------:|-----------------:|-----------------:|----------:|----------:|----------:|
| Summarize | 50 | 1,500 | 2.25M | 0.75M | $0.68 | $1.13 | $1.80 |
| Analyze (6-step) | 10 | 300 | 3.6M | 2.7M | $1.08 | $4.05 | $5.13 |
| Predict | 10 | 300 | 0.6M | 0.24M | $0.18 | $0.36 | $0.54 |
| **Total** | | | **6.45M** | **3.69M** | **$1.94** | **$5.54** | **$7.47/mo** |

#### Medium Usage (50 analyses/day, 200 summaries/day)

| Operation | Calls/Day | Monthly Calls | Input Tokens/Mo | Output Tokens/Mo | Input Cost | Output Cost | **Total** |
|-----------|----------:|-------------:|-----------------:|-----------------:|----------:|----------:|----------:|
| Summarize | 200 | 6,000 | 9M | 3M | $2.70 | $4.50 | $7.20 |
| Analyze (6-step) | 50 | 1,500 | 18M | 13.5M | $5.40 | $20.25 | $25.65 |
| Predict | 50 | 1,500 | 3M | 1.2M | $0.90 | $1.80 | $2.70 |
| **Total** | | | **30M** | **17.7M** | **$9.00** | **$26.55** | **$35.55/mo** |

#### Heavy Usage (200 analyses/day, 1000 summaries/day)

| Operation | Calls/Day | Monthly Calls | Input Tokens/Mo | Output Tokens/Mo | Input Cost | Output Cost | **Total** |
|-----------|----------:|-------------:|-----------------:|-----------------:|----------:|----------:|----------:|
| Summarize | 1,000 | 30,000 | 45M | 15M | $13.50 | $22.50 | $36.00 |
| Analyze (6-step) | 200 | 6,000 | 72M | 54M | $21.60 | $81.00 | $102.60 |
| Predict | 200 | 6,000 | 12M | 4.8M | $3.60 | $7.20 | $10.80 |
| **Total** | | | **129M** | **73.8M** | **$38.70** | **$110.70** | **$149.40/mo** |

### Claude API Cost Summary

| Usage Tier | Monthly Cost (Sonnet 4) | With Haiku for Summaries | With Prompt Caching (~30% savings) |
|------------|------------------------:|-------------------------:|-----------------------------------:|
| Light | $7.47 | $5.67 | $5.23 |
| Medium | $35.55 | $28.35 | $24.89 |
| Heavy | $149.40 | $113.40 | $104.58 |

**Key Insight:** Output tokens dominate costs (75% of total). The 6-step JP 3-60 analysis pipeline is the single largest cost driver -- each full analysis costs approximately $0.017 with Sonnet 4. At heavy usage, analysis alone is $102.60/mo.

---

## 2. Vercel Free Tier Limits

### Hobby Plan Allocations (2026)

| Resource | Hobby (Free) Limit | Pro ($20/mo) Limit |
|----------|--------------------:|-------------------:|
| Edge Requests | 1,000,000/mo | 10,000,000/mo |
| Function Invocations | 1,000,000/mo | 10,000,000/mo |
| Fast Data Transfer (bandwidth) | 100 GB/mo | 1 TB/mo |
| Active CPU Time | 4 hours/mo | 100 hours/mo |
| Provisioned Memory | 360 GB-hrs/mo | 1,000 GB-hrs/mo |
| Build Minutes | 6,000 min/mo | 24,000 min/mo |
| Edge Function Execution | 60s max per invocation | 60s (default) |

### Edge Function Inventory (New + Existing)

The plan adds 7 new Edge Functions:

| Edge Function | Est. Calls/Day (Medium) | Monthly Calls |
|---------------|------------------------:|--------------:|
| `/api/claude/v1/summarize` | 200 | 6,000 |
| `/api/claude/v1/analyze` | 300 (50 x 6 steps) | 9,000 |
| `/api/social/v1/list-reddit-posts` | 288 (every 5 min) | 8,640 |
| `/api/social/v1/list-tweets` | 1,440 (every 1 min) | 43,200 |
| `/api/social/v1/list-bluesky-posts` | 720 (every 2 min) | 21,600 |
| `/api/govdata/v1/list-notams` | 96 (every 15 min) | 2,880 |
| `/api/trajectory/v1/query-flight-history` | 50 (on-demand) | 1,500 |
| Existing functions (RSS, ADS-B, AIS, etc.) | ~2,000 | ~60,000 |
| **Total** | **~5,094** | **~152,820** |

### Will Free Tier Suffice?

At medium usage: **~153K function invocations/mo -- well within the 1M limit.**

**Breaking point calculation:**

| Resource | Free Limit | Medium Usage | Utilization | Breaks At |
|----------|----------:|-------------:|------------:|----------:|
| Edge Requests | 1,000,000 | ~153,000 | 15.3% | ~6.5x medium |
| Active CPU Time | 4 hrs (14,400s) | ~2,500s (est.) | 17.4% | ~5.7x medium |
| Bandwidth | 100 GB | ~5 GB (est.) | 5% | ~20x medium |
| Build Minutes | 6,000 | ~200 (est. 10 deploys) | 3.3% | Not a concern |

**Verdict:** The Vercel free tier is sufficient for medium usage. You would need to exceed roughly 6x medium usage (~300 analyses/day, ~1,200 summaries/day) before hitting the edge request ceiling. The primary constraint is Active CPU Time at high usage, as Claude API calls can take 2-10 seconds each on the edge function.

**Critical concern:** Claude API calls block edge function CPU. Each summarize call takes ~2-5 seconds, each analyze call takes ~5-15 seconds. At heavy usage (200 analyses/day x 6 steps x ~10s avg), that is 12,000 seconds = 3.33 hours of CPU, dangerously close to the 4-hour limit.

**Recommendation:** Monitor Active CPU Time closely. At heavy usage, Vercel Pro ($20/mo) becomes necessary.

---

## 3. Railway Costs

### Hobby Plan

| Item | Cost |
|------|-----:|
| Subscription fee | $5/mo |
| Included credits | $5/mo |
| CPU | ~$0.000231/vCPU-minute |
| Memory | ~$0.000231/GB-minute |
| Egress | Included in credit |

### TikTok Worker Estimate

The TikTok scraper runs on Railway as a persistent worker. Estimated resource usage:

| Resource | Estimate | Monthly Cost |
|----------|----------|-------------:|
| CPU (0.25 vCPU average) | 0.25 x 730 hrs | ~$3.02 |
| Memory (256 MB) | 0.25 GB x 730 hrs | ~$3.02 |
| **Total compute** | | **~$6.04** |
| Minus $5 credit | | **~$1.04 overage** |
| **Effective monthly cost** | | **$5 + $1.04 = $6.04** |

If the worker runs intermittently (e.g., every 10 minutes for 30 seconds), cost drops significantly:

| Scenario | CPU Time/Mo | Memory/Mo | Compute Cost | Effective Cost |
|----------|------------:|----------:|-------------:|---------------:|
| Always-on (0.25 vCPU, 256MB) | 182.5 vCPU-hrs | 182.5 GB-hrs | ~$6.04 | ~$6.04 |
| Cron-style (every 10 min, 30s) | 2.19 vCPU-hrs | 2.19 GB-hrs | ~$0.07 | $5.00 (sub only) |

**Verdict:** A cron-style worker fits easily within the $5 credit. An always-on worker overflows by ~$1/mo. **Railway baseline cost: $5/mo.**

---

## 4. Upstash Redis

### Free Tier (Updated 2025)

| Resource | Free Limit |
|----------|----------:|
| Commands per month | 500,000 |
| Data size | 256 MB |
| Bandwidth | 200 GB/mo (free) |
| Databases | Up to 10 |

### Command Usage Estimate

The design specifies caching for all services with varying TTLs:

| Cache Operation | Frequency | Reads/Day | Writes/Day | Total/Day |
|-----------------|-----------|----------:|----------:|----------:|
| Claude summarize (5 min TTL) | 200 calls/day, 60% cache hit | 120 GET | 80 SET | 200 |
| Claude analyze (15 min TTL) | 50 calls/day, 40% cache hit | 20 GET | 30 SET | 50 |
| Reddit (5 min TTL) | 288 polls/day | 200 GET | 88 SET | 288 |
| Twitter (1 min TTL) | 1,440 polls/day | 1,000 GET | 440 SET | 1,440 |
| Bluesky (2 min TTL) | 720 polls/day | 500 GET | 220 SET | 720 |
| NOTAM (15 min TTL) | 96 polls/day | 70 GET | 26 SET | 96 |
| Trajectory (1 hr TTL) | 50 queries/day | 30 GET | 20 SET | 50 |
| Prediction markets (2 min TTL) | 720 polls/day | 500 GET | 220 SET | 720 |
| RSS feeds (10 min TTL) | ~500 polls/day | 350 GET | 150 SET | 500 |
| **Total** | | | | **~4,064/day** |

**Monthly total: ~121,920 commands/mo**

### Free Tier Assessment

| Usage Level | Commands/Month | Free Limit | Status |
|-------------|---------------:|-----------:|--------|
| Light | ~40,000 | 500,000 | OK (8%) |
| Medium | ~122,000 | 500,000 | OK (24.4%) |
| Heavy | ~480,000 | 500,000 | MARGINAL (96%) |

**Verdict:** The updated Upstash free tier (500K commands/mo) is sufficient for light and medium usage. Heavy usage approaches the limit and would require the pay-as-you-go tier ($0.20 per 100K commands). Overage at heavy usage would cost approximately $0.00-$0.40/mo.

**Note:** The design document mentions "10,000 commands/day" as the free tier -- this is outdated. Upstash upgraded to 500K/month (~16,667/day) in March 2025.

---

## 5. Third-Party API Free Tiers

### Complete Platform Breakdown

| Platform | Free Tier | Rate Limit | Auth Required | Paid Tier Trigger | Paid Cost |
|----------|-----------|------------|:-------------:|-------------------|-----------|
| **Reddit** | Free (non-commercial) | 100 req/min (OAuth) | Yes (OAuth2) | Commercial use | Negotiated |
| **X/Twitter** | Write-only (1,500 tweets/mo) | N/A for reads | Yes (Bearer) | Any read access | $200/mo (Basic) |
| **Bluesky** | Free (AT Protocol) | 5,000 pts/hr, 35,000 pts/day | No | Unlikely for reads | N/A |
| **TikTok (Apify)** | $5 credits/mo (~1,000 results) | N/A | Yes (Apify token) | >1,000 results/mo | $0.005/result |
| **VK** | Free | 3 req/sec | Yes (Service token) | N/A | Free |
| **OpenSky Network** | Free (authenticated) | 4,000 credits/day | Optional | Contributing user bonus | Free (contribute ADS-B) |
| **AISHub** | Free (data sharing) | Undocumented | Yes (requires AIS receiver) | Non-contributor access | Contact for pricing |
| **Polymarket** | Free (public endpoints) | 60 req/min | No | Premium features | $99/mo |
| **Kalshi** | Free (read-only) | Standard tier limits | Yes (RSA key-pair) | Trading API | Trading fees only |
| **Metaculus** | Free | Undocumented (generous) | No | N/A | Free |
| **FAA NOTAM** | Free (government) | Undocumented | Yes (API key) | N/A | Free |
| **OpenSanctions** | Free (non-commercial) | Undocumented | Yes (API key) | Commercial use | Pay-as-you-go |

### CRITICAL ISSUE: X/Twitter API

**The X/Twitter Free Tier no longer supports reading tweets.** The implementation plan uses tweet search (`/2/tweets/search/recent`), which requires at minimum the **Basic tier at $200/month**.

This is the single largest third-party cost risk. Options:

| Option | Cost | Capability |
|--------|-----:|-----------|
| Free Tier | $0 | Write-only. Cannot read tweets. **UNUSABLE.** |
| Basic Tier | $200/mo | 10,000 tweet reads/mo. Sufficient for light use. |
| Pro Tier | $5,000/mo | 1M reads/mo. Overkill for this project. |
| Pay-Per-Use (new 2026) | Variable | Consumption-based. Potentially cheaper. |
| **Alternative: Nitter/scraping** | $0 | Against TOS, unreliable |
| **Alternative: Drop Twitter** | $0 | Lose a key OSINT source |

**Recommendation:** Start without Twitter. Add it only if the project generates revenue. Bluesky + Reddit provide adequate social coverage for OSINT.

### AISHub Access Barrier

AISHub requires operating an AIS receiving station to get API access. This is a hardware requirement (AIS receiver ~$100-300 one-time cost) and is not a simple API signup. If you do not have an AIS receiver, AISHub access is effectively blocked.

---

## 6. Rate Limit Analysis

### Rate Limit Map (All APIs)

| API | Rate Limit | Polling Interval (Design) | Calls/Hour | Limit/Hour | Utilization |
|-----|-----------|--------------------------|----------:|----------:|------------:|
| Reddit (OAuth) | 100 req/min | Every 5 min | 12 | 6,000 | 0.2% |
| X/Twitter (Basic) | ~167 req/15min | Every 1 min | 60 | 668 | 9.0% |
| Bluesky (AT Proto) | 5,000 pts/hr | Every 2 min | 30 | 5,000 | 0.6% |
| VK | 3 req/sec | Every 5 min | 12 | 10,800 | 0.1% |
| OpenSky (Auth) | 4,000 credits/day | Every 15 min + on-demand | ~10 | 167 | 6.0% |
| Polymarket | 60 req/min | Every 2 min | 30 | 3,600 | 0.8% |
| Kalshi | Standard tier | On-demand | ~5 | ~100 | 5.0% |
| Metaculus | Generous (undoc.) | On-demand | ~5 | ~100+ | <5% |
| FAA NOTAM | Undocumented | Every 15 min | 4 | Undoc. | Low |
| Claude API | No hard rate limit | On-demand | Variable | TPM-based | Variable |

### Bottleneck Ranking (Most Likely to Throttle First)

1. **OpenSky Network** -- 4,000 credits/day for authenticated users. Each state vector request costs 4 credits. At 1,000 state requests/day, that is 4,000 credits. Historical trajectory queries cost additional credits. **This is the tightest limit.** If the existing World Monitor base already consumes OpenSky credits for live tracking, adding trajectory history queries will push past the limit.

2. **X/Twitter (if used)** -- 10,000 reads/month on Basic tier. At 60 polls/hour x 24 hours = 1,440 reads/day = 43,200/month. **Exceeds Basic tier by 4.3x.** You would need to poll far less frequently (every 15 minutes instead of every 1 minute) to stay within limits.

3. **Apify (TikTok)** -- $5 free credits = ~1,000 results/month. If scraping geotagged conflict videos across multiple regions, this is consumed quickly.

4. **Claude API** -- No hard rate limit, but token-per-minute (TPM) limits apply. For Sonnet 4, the default is ~40,000 TPM for input. At heavy usage with 6-step analysis, a single analysis consumes ~12K input tokens. Two concurrent analyses would consume 24K tokens, well within TPM. **Not a practical bottleneck** at these usage levels.

5. **Reddit** -- 100 req/min is extremely generous for 12 req/hour usage. **No concern.**

6. **Bluesky** -- 5,000 points/hour, 35,000/day. At 30 req/hour, essentially unlimited. **No concern.**

---

## 7. Cost Optimization Opportunities

### 7.1 Model Tiering (Biggest Savings)

Not all AI tasks require Sonnet 4. Recommended tiering:

| Task | Current Model | Recommended Model | Cost Reduction |
|------|--------------|-------------------|---------------:|
| Headline summarization | Sonnet 4 ($3/$15) | Haiku 4.5 ($1/$5) | **67%** |
| Threat classification | Sonnet 4 | Haiku 4.5 | **67%** |
| JP 3-60 Analysis | Sonnet 4 | Sonnet 4 (keep) | 0% |
| Prediction scoring | Sonnet 4 | Haiku 4.5 | **67%** |
| Focal point detection | Sonnet 4 | Haiku 4.5 | **67%** |

**Impact at medium usage:**

| Strategy | Monthly Claude Cost |
|----------|-------------------:|
| All Sonnet 4 | $35.55 |
| Haiku for summaries, Sonnet for analysis | $28.35 |
| Haiku for everything except JP 3-60 | $15.72 |

### 7.2 Prompt Caching (Easy Win)

The JP 3-60 analysis uses the same system prompt for all 6 steps. With Anthropic's prompt caching:

- System prompt (~500 tokens) cached at 0.1x input price
- Each subsequent step reads from cache instead of re-processing
- **Estimated savings: 20-30% on analysis input costs**

### 7.3 Batch API for Non-Urgent Tasks

The Batch API offers 50% discount but with higher latency (up to 24 hours). Suitable for:

- Historical analysis reports (not time-sensitive)
- Daily intelligence briefs
- Bulk headline processing during off-peak hours

**Estimated savings: 10-15% of total Claude costs if 20-30% of tasks can be batched.**

### 7.4 Aggressive Caching

The design already specifies caching, but TTLs could be extended for cost savings:

| Service | Current TTL | Recommended TTL | Rationale |
|---------|------------|----------------|-----------|
| Claude summarize | 5 min | 15 min | Headlines don't change that fast |
| Claude analyze | 15 min | 30 min | Geopolitical situations evolve slowly |
| Social feeds | 1-5 min | 5-10 min | Slight delay acceptable |
| NOTAM | 15 min | 30 min | NOTAMs are valid for hours |
| Prediction markets | 2 min | 5 min | Markets move slowly for geopolitical events |

Doubling cache TTLs roughly halves the number of API calls, reducing both Claude costs and edge function invocations.

### 7.5 Deduplication of Summarization

The current design summarizes headlines individually. Batching headlines into groups and summarizing them together could reduce Claude calls by 5-10x.

Example: Instead of 50 individual summarize calls, batch into 5 calls of 10 headlines each. Same output quality, 90% fewer API calls.

### 7.6 Combined Savings Estimate (Medium Usage)

| Optimization | Monthly Savings |
|-------------|----------------:|
| Haiku for non-analysis tasks | -$7.20 |
| Prompt caching on analysis | -$5.13 |
| Extended cache TTLs (halves calls) | -$5.00 |
| Headline batching | -$3.00 |
| **Total optimized cost** | **~$15.22/mo** (was $35.55) |

---

## 8. OpenRouter Fallback Costs

### Cost Comparison

When Claude API fails (rate limits, outages), OpenRouter is the fallback. OpenRouter passes through model pricing with a small markup.

| Model via OpenRouter | Input (per 1M) | Output (per 1M) | vs. Direct Claude |
|---------------------|:--------------:|:---------------:|:-----------------:|
| Claude Sonnet 4 | $3.00 | $15.00 | Same price |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Same price |
| Claude Haiku 4.5 | $1.00 | $5.00 | Same price |
| Gemini Flash-Lite | $0.50 | $0.50 | 90% cheaper |
| DeepSeek V3.2 | $0.53 | $0.53 | 90% cheaper |

### Fallback Strategy Recommendation

If Claude API is unavailable, falling back to Gemini Flash-Lite or DeepSeek via OpenRouter for summarization tasks would cost approximately $0.50/1M tokens instead of $3/$15. For analysis tasks, falling back to Claude Sonnet on OpenRouter costs the same as direct.

**Expected fallback frequency:** Claude API has 99.9% uptime historically. Assuming 0.1% fallback rate:

| Usage | Monthly Claude Calls | Fallback Calls (~0.1%) | Fallback Cost Delta |
|-------|---------------------:|-----------------------:|--------------------:|
| Light | ~2,100 | ~2 | ~$0.01 |
| Medium | ~9,000 | ~9 | ~$0.05 |
| Heavy | ~42,000 | ~42 | ~$0.20 |

**Verdict:** Fallback costs are negligible. OpenRouter is effectively a free insurance policy.

---

## 9. Hidden Costs

### Infrastructure

| Item | Cost | Notes |
|------|-----:|-------|
| Domain registration | $10-15/yr | If custom domain desired |
| SSL certificate | $0 | Free via Vercel/Let's Encrypt |
| Vercel Pro (if needed) | $20/mo | Only at heavy usage |
| DNS (Cloudflare) | $0 | Free tier sufficient |

### Monitoring & Error Tracking

| Service | Free Tier | When Paid |
|---------|-----------|-----------|
| Vercel Analytics | Basic (free) | Advanced: included in Pro |
| Sentry (error tracking) | 5K events/mo free | $26/mo for 50K events |
| Uptime monitoring (e.g., Better Stack) | 5 monitors free | $24/mo for more |
| LogSnag / logging | Free tier exists | $14+/mo |

### Development Tools

| Item | Cost | Notes |
|------|-----:|-------|
| Claude API for development | ~$5-20/mo | Testing during development |
| GitHub (public repo) | $0 | Free |
| GitHub Actions (CI/CD) | 2,000 min/mo free | Sufficient |

### One-Time Hardware (if AISHub needed)

| Item | Cost |
|------|-----:|
| AIS receiver (RTL-SDR + antenna) | $100-300 |
| Raspberry Pi for hosting | $50-100 |

### Hidden Cost Summary

| Category | Monthly | Annual |
|----------|--------:|-------:|
| Domain | $1.25 | $15 |
| Monitoring (free tiers) | $0 | $0 |
| Development API usage | $10 | $120 |
| AIS hardware (amortized) | $8.33 | $100 |
| **Total hidden costs** | **~$19.58** | **~$235** |

---

## 10. Break-Even Analysis

### Total Monthly Cost Estimates

| Cost Item | Light | Medium | Heavy |
|-----------|------:|-------:|------:|
| Claude API | $7.47 | $35.55 | $149.40 |
| Claude API (optimized) | $3.50 | $15.22 | $65.00 |
| Vercel | $0 | $0 | $20.00 |
| Railway | $5.00 | $5.00 | $5.00 |
| Upstash Redis | $0 | $0 | $0.40 |
| X/Twitter (if used) | $200.00 | $200.00 | $200.00 |
| X/Twitter (if skipped) | $0 | $0 | $0 |
| Apify (TikTok) | $0 | $5.00 | $29.00 |
| OpenRouter fallback | $0.01 | $0.05 | $0.20 |
| Hidden costs | $11.25 | $11.25 | $19.58 |
| **Total (with Twitter)** | **$223.73** | **$256.85** | **$423.58** |
| **Total (without Twitter)** | **$19.76** | **$36.52** | **$139.18** |
| **Total (optimized, no Twitter)** | **$15.75** | **$31.47** | **$109.98** |

### Break-Even Scenarios

| Scenario | Monthly Cost | Revenue Needed | Viable Without Revenue? |
|----------|-------------:|---------------:|:-----------------------:|
| Minimal (personal use, no Twitter, optimized) | ~$16 | $0 | Yes, hobby budget |
| Standard (no Twitter, unoptimized) | ~$37 | $0 | Yes, hobby budget |
| With Twitter Basic | ~$257 | ~$260/mo | Needs sponsorship/ads |
| Heavy + Twitter | ~$424 | ~$425/mo | Needs revenue model |

### When Revenue Becomes Necessary

- **$0-50/mo:** Sustainable as a personal project. Achievable with optimized Claude usage and no Twitter.
- **$50-100/mo:** Needs either a Patreon/GitHub Sponsors (~20-50 supporters at $2-5/mo) or a single small sponsor.
- **$200+/mo:** Requires either: (a) premium tier with paid subscriptions, (b) institutional sponsor, or (c) grant funding.
- **$400+/mo:** Unsustainable without a clear business model.

---

## 11. Summary & Recommendations

### Top 5 Cost Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **X/Twitter API requires $200/mo minimum** | Dominates entire budget | Skip Twitter at launch. Use Bluesky + Reddit instead. |
| 2 | **Claude API costs scale linearly with usage** | $7-149/mo depending on usage | Use Haiku for simple tasks, prompt caching, batch headlines |
| 3 | **OpenSky rate limits too tight** | Blocks trajectory feature + live tracking | Use authenticated account, contribute ADS-B data for 8K/day |
| 4 | **Vercel CPU time limit at heavy usage** | 4hr/mo limit hit by Claude API wait times | Offload long-running Claude calls to Railway worker |
| 5 | **TikTok scraping costs escalate** | Apify free tier = 1K results only | Cache aggressively, reduce polling frequency |

### Recommended Launch Configuration

| Service | Tier | Monthly Cost |
|---------|------|-------------:|
| Vercel | Hobby (free) | $0 |
| Railway | Hobby ($5/mo) | $5 |
| Upstash Redis | Free | $0 |
| Claude API (Haiku for summaries, Sonnet for analysis) | Pay-as-you-go | ~$15 |
| Reddit | Free (non-commercial) | $0 |
| X/Twitter | **SKIP** | $0 |
| Bluesky | Free | $0 |
| TikTok (Apify) | Free ($5 credits) | $0 |
| VK | Free | $0 |
| OpenSky | Free (authenticated) | $0 |
| Polymarket | Free | $0 |
| Kalshi | Free | $0 |
| Metaculus | Free | $0 |
| FAA NOTAM | Free | $0 |
| OpenSanctions | Free (non-commercial) | $0 |
| **Total** | | **~$20/mo** |

### Action Items

1. **Remove Twitter from MVP scope** -- add it later only with revenue to support the $200/mo minimum.
2. **Implement model tiering** -- use Haiku 4.5 for summarization, Sonnet 4 for JP 3-60 analysis only.
3. **Enable prompt caching** on the JP 3-60 system prompt (same prompt across 6 steps = significant cache hits).
4. **Batch headline summarization** -- process 10-20 headlines per call instead of individually.
5. **Double cache TTLs** across the board to reduce redundant API calls.
6. **Set up Anthropic usage alerts** at $10, $25, $50 thresholds to prevent bill shock.
7. **Register an OpenSky account** and consider contributing ADS-B data to get the 8,000 credits/day tier.
8. **Evaluate AISHub hardware requirement** -- decide if AIS receiver investment is justified before implementing vessel history.
9. **Monitor Vercel Active CPU Time** -- if it exceeds 3 hours/mo, plan migration of Claude calls to Railway.
10. **Consider the X/Twitter pay-per-use model** (launched Feb 2026) as a potential cheaper alternative to the $200/mo Basic tier when ready to add Twitter.

---

*This review is based on publicly available pricing as of March 2026. Prices are subject to change. All estimates assume standard API pricing without negotiated enterprise discounts.*
