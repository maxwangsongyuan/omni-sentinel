# Omni Sentinel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend World Monitor with Claude AI, social media feeds, JP 3-60 analysis, government data, historical trajectories, prediction markets, and expanded RSS.

**Architecture:** Proto-first Plugin mode — each feature is a new protobuf service with Edge Function handler, client wrapper, and panel component. All follow World Monitor's existing `proto → buf generate → handler → edge function → client → panel` pipeline.

**Tech Stack:** TypeScript, Preact, Protobuf (buf/sebuf), Vercel Edge Functions, Railway relay, Anthropic SDK, i18next.

---

## Module 1: Claude AI Provider

### Task 1.1: Register Claude feature flag

**Files:**
- Modify: `src/services/runtime-config.ts`

**Step 1: Add Claude to RuntimeFeatureId type**

Find the `RuntimeFeatureId` type union and add `'aiClaude'`:

```typescript
export type RuntimeFeatureId =
  | 'aiClaude'        // ← ADD THIS
  | 'aiGroq'
  | 'aiOpenRouter'
  // ... rest unchanged
```

**Step 2: Add Claude to RUNTIME_FEATURES array**

Add this entry at the top of the `RUNTIME_FEATURES` array:

```typescript
{
  id: 'aiClaude',
  name: 'Claude AI',
  description: 'Anthropic Claude for summarization and geopolitical analysis',
  requiredSecrets: ['CLAUDE_API_KEY'],
  fallback: 'OpenRouter or disabled',
},
```

**Step 3: Add CLAUDE_API_KEY to RuntimeSecretKey type**

Find the `RuntimeSecretKey` type and add `'CLAUDE_API_KEY'`.

**Step 4: Set default toggle**

In `defaultToggles`, add: `aiClaude: true`

**Step 5: Commit**

```bash
git add src/services/runtime-config.ts
git commit -m "feat: register Claude AI feature flag and secret key"
```

---

### Task 1.2: Define Claude proto service

**Files:**
- Create: `proto/worldmonitor/claude/v1/service.proto`
- Create: `proto/worldmonitor/claude/v1/summarize.proto`
- Create: `proto/worldmonitor/claude/v1/analyze.proto`

**Step 1: Create service.proto**

```protobuf
syntax = "proto3";
package worldmonitor.claude.v1;

import "worldmonitor/claude/v1/summarize.proto";
import "worldmonitor/claude/v1/analyze.proto";
import "sebuf/http/annotations.proto";

service ClaudeService {
  option (sebuf.http.service_config) = {base_path: "/api/claude/v1"};

  rpc Summarize(SummarizeRequest) returns (SummarizeResponse) {
    option (sebuf.http.config) = {path: "/summarize", method: HTTP_METHOD_POST};
  }

  rpc Analyze(AnalyzeRequest) returns (AnalyzeResponse) {
    option (sebuf.http.config) = {path: "/analyze", method: HTTP_METHOD_POST};
  }
}
```

**Step 2: Create summarize.proto**

```protobuf
syntax = "proto3";
package worldmonitor.claude.v1;

message SummarizeRequest {
  repeated string headlines = 1;
  string lang = 2;
  string geo_context = 3;
  string variant = 4;
}

message SummarizeResponse {
  string summary = 1;
  string provider = 2;
  bool cached = 3;
}
```

**Step 3: Create analyze.proto**

```protobuf
syntax = "proto3";
package worldmonitor.claude.v1;

message AnalyzeRequest {
  string query = 1;
  repeated string context_headlines = 2;
  string region = 3;
  string timeframe = 4;
}

message AnalyzeResponse {
  string analysis = 1;
  repeated DimensionScore dimensions = 2;
  double overall_probability = 3;
  string confidence = 4;
  string timeframe = 5;
}

message DimensionScore {
  string name = 1;
  double score = 2;
  double weight = 3;
  string rationale = 4;
}
```

**Step 4: Generate TypeScript from protos**

```bash
cd /Users/maxwsy/workspace/omni-sentinel
npx buf generate proto/
```

**Step 5: Commit**

```bash
git add proto/worldmonitor/claude/ src/generated/
git commit -m "feat: define Claude service proto and generate TypeScript"
```

---

### Task 1.3: Implement Claude server handler

**Files:**
- Create: `server/worldmonitor/claude/v1/handler.ts`
- Create: `server/worldmonitor/claude/v1/summarize.ts`
- Create: `server/worldmonitor/claude/v1/analyze.ts`

**Step 1: Create handler.ts**

```typescript
import type { ClaudeServiceHandler } from '../../../../src/generated/server/worldmonitor/claude/v1/service_server';
import { summarize } from './summarize';
import { analyze } from './analyze';

export const claudeHandler: ClaudeServiceHandler = {
  summarize,
  analyze,
};
```

**Step 2: Create summarize.ts**

```typescript
import type { SummarizeRequest, SummarizeResponse } from '../../../../src/generated/server/worldmonitor/claude/v1/service_server';
import { cachedFetchJson } from '../../../gateway';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function summarize(request: SummarizeRequest): Promise<SummarizeResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return { summary: '', provider: 'claude', cached: false };
  }

  const prompt = `Summarize these headlines into a concise intelligence brief (2-3 paragraphs). Focus on geopolitical significance. Language: ${request.lang || 'en'}. Region focus: ${request.geoContext || 'global'}.\n\nHeadlines:\n${request.headlines.join('\n')}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    return { summary: '', provider: 'claude', cached: false };
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  return {
    summary: data.content?.[0]?.text ?? '',
    provider: 'claude',
    cached: false,
  };
}
```

**Step 3: Create analyze.ts**

```typescript
import type { AnalyzeRequest, AnalyzeResponse } from '../../../../src/generated/server/worldmonitor/claude/v1/service_server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const JP360_SYSTEM_PROMPT = `You are a geopolitical intelligence analyst using the JP 3-60 Joint Targeting framework. Analyze the situation using these six dimensions:

1. Military Readiness (20% weight) — Force deployments, logistics, exercises
2. Political Will (25% weight) — Leadership statements, domestic politics, election cycles
3. Target Urgency (20% weight) — Threat timelines, capability windows
4. Diplomatic Alternatives (15% weight) — Negotiation status, sanctions effectiveness
5. Allied Support (10% weight) — Coalition readiness, basing agreements
6. Provocation Level (10% weight) — Recent incidents, escalation patterns

For each dimension, provide:
- A score from 0.0 to 1.0
- Brief rationale (1-2 sentences)

Then provide:
- Overall weighted probability (0.0 to 1.0)
- Confidence level (low/medium/high)
- Key indicators to watch

Respond in JSON format matching this schema:
{
  "dimensions": [{"name": string, "score": number, "weight": number, "rationale": string}],
  "overall_probability": number,
  "confidence": string,
  "analysis": string,
  "timeframe": string
}`;

export async function analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return { analysis: '', dimensions: [], overallProbability: 0, confidence: 'low', timeframe: '' };
  }

  const userPrompt = `Query: ${request.query}\nRegion: ${request.region || 'global'}\nTimeframe: ${request.timeframe || '7 days'}\n\nRecent headlines for context:\n${(request.contextHeadlines || []).join('\n')}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: JP360_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    return { analysis: '', dimensions: [], overallProbability: 0, confidence: 'low', timeframe: '' };
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  const text = data.content?.[0]?.text ?? '';

  try {
    const parsed = JSON.parse(text);
    return {
      analysis: parsed.analysis ?? '',
      dimensions: parsed.dimensions ?? [],
      overallProbability: parsed.overall_probability ?? 0,
      confidence: parsed.confidence ?? 'low',
      timeframe: parsed.timeframe ?? request.timeframe ?? '',
    };
  } catch {
    return { analysis: text, dimensions: [], overallProbability: 0, confidence: 'low', timeframe: '' };
  }
}
```

**Step 4: Commit**

```bash
git add server/worldmonitor/claude/
git commit -m "feat: implement Claude service handler with summarize and analyze RPCs"
```

---

### Task 1.4: Create Claude Edge Function and client

**Files:**
- Create: `api/claude/v1/[rpc].ts`
- Create: `src/services/claude/index.ts`
- Modify: `server/gateway.ts` (add cache tier)

**Step 1: Create Edge Function**

```typescript
export const config = { runtime: 'edge' };

import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createClaudeServiceRoutes } from '../../../src/generated/server/worldmonitor/claude/v1/service_server';
import { claudeHandler } from '../../../server/worldmonitor/claude/v1/handler';

export default createDomainGateway(
  createClaudeServiceRoutes(claudeHandler, serverOptions),
);
```

**Step 2: Create client wrapper**

```typescript
import { ClaudeServiceClient } from '../../generated/client/worldmonitor/claude/v1/service_client';
import { createCircuitBreaker } from '../circuit-breaker';
import type { SummarizeResponse, AnalyzeResponse } from '../../generated/client/worldmonitor/claude/v1/service_client';

const client = new ClaudeServiceClient('', { fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args) });

const summarizeBreaker = createCircuitBreaker<SummarizeResponse>({ name: 'Claude Summarize', cacheTtlMs: 5 * 60 * 1000, persistCache: true });
const analyzeBreaker = createCircuitBreaker<AnalyzeResponse>({ name: 'Claude Analyze', cacheTtlMs: 15 * 60 * 1000, persistCache: true });

export async function claudeSummarize(headlines: string[], lang = 'en', geoContext = 'global', variant = 'full'): Promise<string> {
  const resp = await summarizeBreaker.execute(async () => {
    return client.summarize({ headlines, lang, geoContext, variant });
  }, { summary: '', provider: 'claude', cached: false });
  return resp.summary;
}

export interface AnalysisResult {
  analysis: string;
  dimensions: Array<{ name: string; score: number; weight: number; rationale: string }>;
  overallProbability: number;
  confidence: string;
  timeframe: string;
}

export async function claudeAnalyze(query: string, headlines: string[], region = 'global', timeframe = '7 days'): Promise<AnalysisResult> {
  const resp = await analyzeBreaker.execute(async () => {
    return client.analyze({ query, contextHeadlines: headlines, region, timeframe });
  }, { analysis: '', dimensions: [], overallProbability: 0, confidence: 'low', timeframe: '' });
  return resp as AnalysisResult;
}
```

**Step 3: Add cache tiers to gateway.ts**

In the `RPC_CACHE_TIER` record, add:

```typescript
'/api/claude/v1/summarize': 'medium',
'/api/claude/v1/analyze': 'slow',
```

**Step 4: Commit**

```bash
git add api/claude/ src/services/claude/ server/gateway.ts
git commit -m "feat: add Claude Edge Function, client wrapper, and cache tiers"
```

---

### Task 1.5: Wire Claude into summarization fallback chain

**Files:**
- Modify: `src/services/summarization.ts`

**Step 1: Update API_PROVIDERS array**

Replace the existing `API_PROVIDERS` with:

```typescript
const API_PROVIDERS: ApiProviderDef[] = [
  { featureId: 'aiClaude',      provider: 'claude',      label: 'Claude' },
  { featureId: 'aiOpenRouter',  provider: 'openrouter',  label: 'OpenRouter' },
];
```

This removes Ollama and Groq, making Claude primary with OpenRouter as fallback.

**Step 2: Add Claude provider type**

Find the `SummarizationProvider` type and add `'claude'`:

```typescript
export type SummarizationProvider = 'claude' | 'ollama' | 'groq' | 'openrouter' | 'browser' | 'cache';
```

**Step 3: Commit**

```bash
git add src/services/summarization.ts
git commit -m "feat: wire Claude as primary AI provider in fallback chain"
```

---

## Module 2: Social Media Integration

### Task 2.1: Define Social proto service

**Files:**
- Create: `proto/worldmonitor/social/v1/service.proto`
- Create: `proto/worldmonitor/social/v1/common.proto`
- Create: `proto/worldmonitor/social/v1/reddit.proto`
- Create: `proto/worldmonitor/social/v1/twitter.proto`
- Create: `proto/worldmonitor/social/v1/bluesky.proto`

**Step 1: Create common.proto**

```protobuf
syntax = "proto3";
package worldmonitor.social.v1;

message SocialPost {
  string id = 1;
  string platform = 2;
  string author = 3;
  string text = 4;
  string url = 5;
  string timestamp = 6;
  int32 engagement = 7;
  double latitude = 8;
  double longitude = 9;
  string topic = 10;
  repeated string tags = 11;
}
```

**Step 2: Create reddit.proto**

```protobuf
syntax = "proto3";
package worldmonitor.social.v1;

import "worldmonitor/social/v1/common.proto";

message ListRedditPostsRequest {
  repeated string subreddits = 1;
  int32 limit = 2;
  string sort = 3;
}

message ListRedditPostsResponse {
  repeated SocialPost posts = 1;
  int32 count = 2;
}
```

**Step 3: Create twitter.proto**

```protobuf
syntax = "proto3";
package worldmonitor.social.v1;

import "worldmonitor/social/v1/common.proto";

message ListTweetsRequest {
  repeated string accounts = 1;
  string query = 2;
  int32 limit = 3;
}

message ListTweetsResponse {
  repeated SocialPost posts = 1;
  int32 count = 2;
}
```

**Step 4: Create bluesky.proto**

```protobuf
syntax = "proto3";
package worldmonitor.social.v1;

import "worldmonitor/social/v1/common.proto";

message ListBlueskyPostsRequest {
  string query = 1;
  int32 limit = 2;
}

message ListBlueskyPostsResponse {
  repeated SocialPost posts = 1;
  int32 count = 2;
}
```

**Step 5: Create service.proto**

```protobuf
syntax = "proto3";
package worldmonitor.social.v1;

import "worldmonitor/social/v1/reddit.proto";
import "worldmonitor/social/v1/twitter.proto";
import "worldmonitor/social/v1/bluesky.proto";
import "sebuf/http/annotations.proto";

service SocialService {
  option (sebuf.http.service_config) = {base_path: "/api/social/v1"};

  rpc ListRedditPosts(ListRedditPostsRequest) returns (ListRedditPostsResponse) {
    option (sebuf.http.config) = {path: "/list-reddit-posts", method: HTTP_METHOD_GET};
  }

  rpc ListTweets(ListTweetsRequest) returns (ListTweetsResponse) {
    option (sebuf.http.config) = {path: "/list-tweets", method: HTTP_METHOD_GET};
  }

  rpc ListBlueskyPosts(ListBlueskyPostsRequest) returns (ListBlueskyPostsResponse) {
    option (sebuf.http.config) = {path: "/list-bluesky-posts", method: HTTP_METHOD_GET};
  }
}
```

**Step 6: Generate TypeScript**

```bash
npx buf generate proto/
```

**Step 7: Commit**

```bash
git add proto/worldmonitor/social/ src/generated/
git commit -m "feat: define Social service proto with Reddit, Twitter, Bluesky RPCs"
```

---

### Task 2.2: Implement Reddit handler

**Files:**
- Create: `server/worldmonitor/social/v1/handler.ts`
- Create: `server/worldmonitor/social/v1/list-reddit-posts.ts`

**Step 1: Create list-reddit-posts.ts**

```typescript
import type { ListRedditPostsRequest, ListRedditPostsResponse } from '../../../../src/generated/server/worldmonitor/social/v1/service_server';

const DEFAULT_SUBREDDITS = ['OSINT', 'geopolitics', 'CombatFootage', 'worldnews'];
const REDDIT_USER_AGENT = 'OmniSentinel/1.0';

export async function listRedditPosts(request: ListRedditPostsRequest): Promise<ListRedditPostsResponse> {
  const subreddits = request.subreddits.length > 0 ? request.subreddits : DEFAULT_SUBREDDITS;
  const limit = request.limit || 25;
  const sort = request.sort || 'hot';

  const allPosts = await Promise.allSettled(
    subreddits.map(async (sub) => {
      const url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': REDDIT_USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json() as { data: { children: Array<{ data: Record<string, unknown> }> } };
      return (data.data?.children ?? []).map((child) => ({
        id: `reddit-${child.data.id}`,
        platform: 'reddit',
        author: `u/${child.data.author}`,
        text: `[r/${sub}] ${child.data.title}`,
        url: `https://reddit.com${child.data.permalink}`,
        timestamp: new Date((child.data.created_utc as number) * 1000).toISOString(),
        engagement: (child.data.score as number) ?? 0,
        latitude: 0,
        longitude: 0,
        topic: sub.toLowerCase(),
        tags: [sub],
      }));
    }),
  );

  const posts = allPosts
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<Array<Record<string, unknown>>>).value)
    .sort((a, b) => (b.engagement as number) - (a.engagement as number));

  return { posts, count: posts.length };
}
```

**Step 2: Create handler.ts (start with Reddit only)**

```typescript
import type { SocialServiceHandler } from '../../../../src/generated/server/worldmonitor/social/v1/service_server';
import { listRedditPosts } from './list-reddit-posts';

export const socialHandler: SocialServiceHandler = {
  listRedditPosts,
  listTweets: async () => ({ posts: [], count: 0 }),           // stub
  listBlueskyPosts: async () => ({ posts: [], count: 0 }),     // stub
};
```

**Step 3: Commit**

```bash
git add server/worldmonitor/social/
git commit -m "feat: implement Reddit handler with subreddit aggregation"
```

---

### Task 2.3: Implement Twitter and Bluesky handlers

**Files:**
- Create: `server/worldmonitor/social/v1/list-tweets.ts`
- Create: `server/worldmonitor/social/v1/list-bluesky-posts.ts`
- Modify: `server/worldmonitor/social/v1/handler.ts`

**Step 1: Create list-tweets.ts**

```typescript
import type { ListTweetsRequest, ListTweetsResponse } from '../../../../src/generated/server/worldmonitor/social/v1/service_server';

const DEFAULT_ACCOUNTS = ['sentdefender', 'AuroraIntel', 'Bellingcat', 'IntelCrab'];

export async function listTweets(request: ListTweetsRequest): Promise<ListTweetsResponse> {
  const apiKey = process.env.TWITTER_BEARER_TOKEN;
  if (!apiKey) return { posts: [], count: 0 };

  const query = request.query || request.accounts.map((a) => `from:${a}`).join(' OR ') || DEFAULT_ACCOUNTS.map((a) => `from:${a}`).join(' OR ');
  const limit = request.limit || 20;

  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.min(limit, 100)}&tweet.fields=created_at,public_metrics,author_id,geo`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return { posts: [], count: 0 };

  const data = await res.json() as { data?: Array<Record<string, unknown>> };
  const posts = (data.data ?? []).map((tweet) => ({
    id: `twitter-${tweet.id}`,
    platform: 'twitter',
    author: String(tweet.author_id ?? ''),
    text: String(tweet.text ?? ''),
    url: `https://x.com/i/status/${tweet.id}`,
    timestamp: String(tweet.created_at ?? new Date().toISOString()),
    engagement: ((tweet.public_metrics as Record<string, number>)?.like_count ?? 0) + ((tweet.public_metrics as Record<string, number>)?.retweet_count ?? 0),
    latitude: 0,
    longitude: 0,
    topic: 'osint',
    tags: ['twitter'],
  }));

  return { posts, count: posts.length };
}
```

**Step 2: Create list-bluesky-posts.ts**

```typescript
import type { ListBlueskyPostsRequest, ListBlueskyPostsResponse } from '../../../../src/generated/server/worldmonitor/social/v1/service_server';

export async function listBlueskyPosts(request: ListBlueskyPostsRequest): Promise<ListBlueskyPostsResponse> {
  const query = request.query || 'OSINT OR geopolitics OR military';
  const limit = request.limit || 25;

  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { posts: [], count: 0 };

  const data = await res.json() as { posts?: Array<Record<string, unknown>> };
  const posts = (data.posts ?? []).map((post) => {
    const record = post.record as Record<string, unknown> | undefined;
    const author = post.author as Record<string, unknown> | undefined;
    return {
      id: `bluesky-${post.uri}`,
      platform: 'bluesky',
      author: `@${author?.handle ?? 'unknown'}`,
      text: String(record?.text ?? ''),
      url: `https://bsky.app/profile/${author?.handle}/post/${String(post.uri).split('/').pop()}`,
      timestamp: String(record?.createdAt ?? new Date().toISOString()),
      engagement: (post.likeCount as number ?? 0) + (post.repostCount as number ?? 0),
      latitude: 0,
      longitude: 0,
      topic: 'osint',
      tags: ['bluesky'],
    };
  });

  return { posts, count: posts.length };
}
```

**Step 3: Update handler.ts**

```typescript
import type { SocialServiceHandler } from '../../../../src/generated/server/worldmonitor/social/v1/service_server';
import { listRedditPosts } from './list-reddit-posts';
import { listTweets } from './list-tweets';
import { listBlueskyPosts } from './list-bluesky-posts';

export const socialHandler: SocialServiceHandler = {
  listRedditPosts,
  listTweets,
  listBlueskyPosts,
};
```

**Step 4: Commit**

```bash
git add server/worldmonitor/social/
git commit -m "feat: implement Twitter and Bluesky social feed handlers"
```

---

### Task 2.4: Create Social Edge Function, client, and panel registration

**Files:**
- Create: `api/social/v1/[rpc].ts`
- Create: `src/services/social/index.ts`
- Modify: `server/gateway.ts`
- Modify: `src/config/panels.ts`
- Modify: `src/services/runtime-config.ts`

**Step 1: Create Edge Function**

```typescript
export const config = { runtime: 'edge' };

import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createSocialServiceRoutes } from '../../../src/generated/server/worldmonitor/social/v1/service_server';
import { socialHandler } from '../../../server/worldmonitor/social/v1/handler';

export default createDomainGateway(
  createSocialServiceRoutes(socialHandler, serverOptions),
);
```

**Step 2: Create client wrapper**

```typescript
import { SocialServiceClient } from '../../generated/client/worldmonitor/social/v1/service_client';
import { createCircuitBreaker } from '../circuit-breaker';

export interface SocialPost {
  id: string;
  platform: string;
  author: string;
  text: string;
  url: string;
  timestamp: string;
  engagement: number;
  latitude: number;
  longitude: number;
  topic: string;
  tags: string[];
}

export interface SocialFeedResponse {
  posts: SocialPost[];
  count: number;
}

const client = new SocialServiceClient('', { fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args) });

const redditBreaker = createCircuitBreaker<SocialFeedResponse>({ name: 'Reddit', cacheTtlMs: 5 * 60 * 1000, persistCache: true });
const twitterBreaker = createCircuitBreaker<SocialFeedResponse>({ name: 'Twitter', cacheTtlMs: 60 * 1000, persistCache: true });
const blueskyBreaker = createCircuitBreaker<SocialFeedResponse>({ name: 'Bluesky', cacheTtlMs: 2 * 60 * 1000, persistCache: true });

const emptyResponse: SocialFeedResponse = { posts: [], count: 0 };

export async function fetchRedditPosts(): Promise<SocialFeedResponse> {
  return redditBreaker.execute(() => client.listRedditPosts({ subreddits: [], limit: 25, sort: 'hot' }), emptyResponse);
}

export async function fetchTweets(): Promise<SocialFeedResponse> {
  return twitterBreaker.execute(() => client.listTweets({ accounts: [], query: '', limit: 20 }), emptyResponse);
}

export async function fetchBlueskyPosts(): Promise<SocialFeedResponse> {
  return blueskyBreaker.execute(() => client.listBlueskyPosts({ query: '', limit: 25 }), emptyResponse);
}

export async function fetchAllSocialFeeds(): Promise<SocialFeedResponse> {
  const [reddit, twitter, bluesky] = await Promise.allSettled([fetchRedditPosts(), fetchTweets(), fetchBlueskyPosts()]);
  const allPosts = [
    ...(reddit.status === 'fulfilled' ? reddit.value.posts : []),
    ...(twitter.status === 'fulfilled' ? twitter.value.posts : []),
    ...(bluesky.status === 'fulfilled' ? bluesky.value.posts : []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return { posts: allPosts, count: allPosts.length };
}
```

**Step 3: Add cache tiers in gateway.ts**

```typescript
'/api/social/v1/list-reddit-posts': 'medium',
'/api/social/v1/list-tweets': 'fast',
'/api/social/v1/list-bluesky-posts': 'fast',
```

**Step 4: Register social-feed panel in panels.ts**

Add to `FULL_PANELS`:

```typescript
'social-feed': { name: 'Social Intelligence', enabled: true, priority: 2 },
```

**Step 5: Register feature flags in runtime-config.ts**

Add to `RuntimeFeatureId`: `'socialReddit' | 'socialTwitter' | 'socialBluesky'`

Add to `RUNTIME_FEATURES`:

```typescript
{ id: 'socialReddit', name: 'Reddit Feed', description: 'OSINT subreddit monitoring', requiredSecrets: [], fallback: 'Disabled' },
{ id: 'socialTwitter', name: 'X/Twitter Feed', description: 'OSINT account monitoring', requiredSecrets: ['TWITTER_BEARER_TOKEN'], fallback: 'Disabled' },
{ id: 'socialBluesky', name: 'Bluesky Feed', description: 'Bluesky OSINT search', requiredSecrets: [], fallback: 'Disabled' },
```

**Step 6: Commit**

```bash
git add api/social/ src/services/social/ server/gateway.ts src/config/panels.ts src/services/runtime-config.ts
git commit -m "feat: add Social service Edge Function, client, panel registration"
```

---

## Module 3: JP 3-60 Analysis Agent (uses Claude Analyze RPC from Module 1)

### Task 3.1: Register Analyst panel and i18n

**Files:**
- Modify: `src/config/panels.ts`
- Modify: `src/locales/en.json`

**Step 1: Add analyst panel to FULL_PANELS**

```typescript
analyst: { name: 'JP 3-60 Analyst', enabled: true, priority: 1 },
```

**Step 2: Add i18n keys to en.json**

Add under a new `"analyst"` section:

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
  "error": "Analysis failed. Check your Claude API key in settings."
}
```

**Step 3: Commit**

```bash
git add src/config/panels.ts src/locales/en.json
git commit -m "feat: register JP 3-60 Analyst panel and add i18n keys"
```

---

## Module 4: Government Data (NOTAM/NAVTEX)

### Task 4.1: Define GovData proto service

**Files:**
- Create: `proto/worldmonitor/govdata/v1/service.proto`
- Create: `proto/worldmonitor/govdata/v1/notam.proto`

**Step 1: Create notam.proto**

```protobuf
syntax = "proto3";
package worldmonitor.govdata.v1;

message Notam {
  string id = 1;
  string location = 2;
  string type = 3;
  string text = 4;
  string effective_start = 5;
  string effective_end = 6;
  double latitude = 7;
  double longitude = 8;
  double radius_nm = 9;
}

message ListNotamsRequest {
  string region = 1;
  int32 limit = 2;
}

message ListNotamsResponse {
  repeated Notam notams = 1;
  int32 count = 2;
}
```

**Step 2: Create service.proto**

```protobuf
syntax = "proto3";
package worldmonitor.govdata.v1;

import "worldmonitor/govdata/v1/notam.proto";
import "sebuf/http/annotations.proto";

service GovDataService {
  option (sebuf.http.service_config) = {base_path: "/api/govdata/v1"};

  rpc ListNotams(ListNotamsRequest) returns (ListNotamsResponse) {
    option (sebuf.http.config) = {path: "/list-notams", method: HTTP_METHOD_GET};
  }
}
```

**Step 3: Generate and commit**

```bash
npx buf generate proto/
git add proto/worldmonitor/govdata/ src/generated/
git commit -m "feat: define GovData service proto with NOTAM support"
```

---

### Task 4.2: Implement NOTAM handler, Edge Function, and client

**Files:**
- Create: `server/worldmonitor/govdata/v1/handler.ts`
- Create: `server/worldmonitor/govdata/v1/list-notams.ts`
- Create: `api/govdata/v1/[rpc].ts`
- Create: `src/services/govdata/index.ts`

**Step 1: Create list-notams.ts**

```typescript
import type { ListNotamsRequest, ListNotamsResponse } from '../../../../src/generated/server/worldmonitor/govdata/v1/service_server';

const FAA_NOTAM_API = 'https://external-api.faa.gov/notamapi/v1/notams';

export async function listNotams(request: ListNotamsRequest): Promise<ListNotamsResponse> {
  const apiKey = process.env.FAA_API_KEY;
  if (!apiKey) return { notams: [], count: 0 };

  const url = `${FAA_NOTAM_API}?responseFormat=geoJson&notamType=NOTAM&featureType=TFR&pageSize=${request.limit || 50}`;

  const res = await fetch(url, {
    headers: { 'client_id': apiKey },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return { notams: [], count: 0 };

  const data = await res.json() as { items?: Array<Record<string, unknown>> };
  const notams = (data.items ?? []).map((item) => {
    const props = item.properties as Record<string, unknown> | undefined;
    const geom = item.geometry as Record<string, unknown> | undefined;
    const coords = (geom?.coordinates as number[]) ?? [0, 0];
    return {
      id: String(props?.coreNOTAMData?.notam?.id ?? item.id ?? ''),
      location: String(props?.coreNOTAMData?.notam?.location ?? ''),
      type: 'TFR',
      text: String(props?.coreNOTAMData?.notam?.text ?? ''),
      effectiveStart: String(props?.coreNOTAMData?.notam?.effectiveStart ?? ''),
      effectiveEnd: String(props?.coreNOTAMData?.notam?.effectiveEnd ?? ''),
      latitude: coords[1] ?? 0,
      longitude: coords[0] ?? 0,
      radiusNm: 0,
    };
  });

  return { notams, count: notams.length };
}
```

**Step 2: Create handler.ts, Edge Function, client (same pattern as above)**

Follow same patterns from Tasks 1.3, 1.4. Handler exports `govDataHandler`, Edge Function uses `createGovDataServiceRoutes`.

**Step 3: Add cache tier**

```typescript
'/api/govdata/v1/list-notams': 'medium',
```

**Step 4: Commit**

```bash
git add server/worldmonitor/govdata/ api/govdata/ src/services/govdata/ server/gateway.ts
git commit -m "feat: implement NOTAM handler with FAA API integration"
```

---

## Module 5: Historical Trajectory

### Task 5.1: Define Trajectory proto and implement OpenSky history handler

**Files:**
- Create: `proto/worldmonitor/trajectory/v1/service.proto`
- Create: `proto/worldmonitor/trajectory/v1/flight_history.proto`
- Create: `server/worldmonitor/trajectory/v1/handler.ts`
- Create: `server/worldmonitor/trajectory/v1/query-flight-history.ts`
- Create: `api/trajectory/v1/[rpc].ts`
- Create: `src/services/trajectory/index.ts`

**Step 1: Create flight_history.proto**

```protobuf
syntax = "proto3";
package worldmonitor.trajectory.v1;

message TrajectoryPoint {
  double latitude = 1;
  double longitude = 2;
  double altitude = 3;
  string timestamp = 4;
  double velocity = 5;
  double heading = 6;
}

message QueryFlightHistoryRequest {
  string icao24 = 1;
  int64 begin = 2;
  int64 end = 3;
}

message QueryFlightHistoryResponse {
  string icao24 = 1;
  string callsign = 2;
  repeated TrajectoryPoint points = 3;
}
```

**Step 2: Create service.proto**

```protobuf
syntax = "proto3";
package worldmonitor.trajectory.v1;

import "worldmonitor/trajectory/v1/flight_history.proto";
import "sebuf/http/annotations.proto";

service TrajectoryService {
  option (sebuf.http.service_config) = {base_path: "/api/trajectory/v1"};

  rpc QueryFlightHistory(QueryFlightHistoryRequest) returns (QueryFlightHistoryResponse) {
    option (sebuf.http.config) = {path: "/query-flight-history", method: HTTP_METHOD_GET};
  }
}
```

**Step 3: Create query-flight-history.ts**

```typescript
import type { QueryFlightHistoryRequest, QueryFlightHistoryResponse } from '../../../../src/generated/server/worldmonitor/trajectory/v1/service_server';

const OPENSKY_API = 'https://opensky-network.org/api';

export async function queryFlightHistory(request: QueryFlightHistoryRequest): Promise<QueryFlightHistoryResponse> {
  const { icao24, begin, end } = request;
  const url = `${OPENSKY_API}/tracks/all?icao24=${icao24}&time=${begin}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { icao24, callsign: '', points: [] };

  const data = await res.json() as { callsign?: string; path?: Array<Array<number>> };
  const points = (data.path ?? []).map((p) => ({
    timestamp: new Date(p[0] * 1000).toISOString(),
    latitude: p[1] ?? 0,
    longitude: p[2] ?? 0,
    altitude: p[3] ?? 0,
    heading: p[4] ?? 0,
    velocity: 0,
  }));

  return { icao24, callsign: data.callsign?.trim() ?? '', points };
}
```

**Step 4: Create handler, Edge Function, client following standard patterns**

**Step 5: Add cache tier**

```typescript
'/api/trajectory/v1/query-flight-history': 'slow',
```

**Step 6: Generate and commit**

```bash
npx buf generate proto/
git add proto/worldmonitor/trajectory/ src/generated/ server/worldmonitor/trajectory/ api/trajectory/ src/services/trajectory/ server/gateway.ts
git commit -m "feat: implement trajectory service with OpenSky flight history"
```

---

## Module 6: Enhanced Prediction Markets

### Task 6.1: Add Kalshi and Metaculus to existing prediction service

**Files:**
- Create: `server/worldmonitor/prediction/v1/list-kalshi-markets.ts`
- Create: `server/worldmonitor/prediction/v1/list-metaculus-questions.ts`
- Modify: `server/worldmonitor/prediction/v1/handler.ts`

**Step 1: Create list-kalshi-markets.ts**

```typescript
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

export async function listKalshiMarkets(request: { query: string; limit: number }): Promise<{ markets: Array<Record<string, unknown>>; count: number }> {
  const url = `${KALSHI_API}/markets?status=open&limit=${request.limit || 20}${request.query ? `&series_ticker=${request.query}` : ''}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { markets: [], count: 0 };

  const data = await res.json() as { markets?: Array<Record<string, unknown>> };
  const markets = (data.markets ?? []).map((m) => ({
    id: `kalshi-${m.ticker}`,
    platform: 'kalshi',
    title: m.title,
    probability: (m.last_price as number ?? 0) / 100,
    volume: m.volume,
    url: `https://kalshi.com/markets/${m.ticker}`,
    closeDate: m.close_time,
  }));

  return { markets, count: markets.length };
}
```

**Step 2: Create list-metaculus-questions.ts** (similar pattern, Metaculus API)

**Step 3: Add new RPCs to handler**

**Step 4: Commit**

```bash
git add server/worldmonitor/prediction/
git commit -m "feat: add Kalshi and Metaculus prediction market handlers"
```

---

## Module 7: Expanded RSS News Sources

### Task 7.1: Add new RSS feeds and domains

**Files:**
- Modify: `src/config/feeds.ts`
- Modify: `api/rss-proxy.js`

**Step 1: Add feeds to SOURCE_TIERS in feeds.ts**

```typescript
// Defense & Intelligence
'ISW': 3,
'INSS': 3,
'IISS': 3,
'RUSI': 3,
'Stars and Stripes': 3,

// Think Tanks
'CSIS': 3,
'Carnegie': 3,
'Atlantic Council': 3,
'Brookings': 3,

// Regional
'Al-Monitor': 3,
'Middle East Eye': 3,
'The Diplomat': 3,
'Nikkei Asia': 3,
```

**Step 2: Add RSS feed URLs to appropriate variant feeds**

Add to the feeds array in FULL variant:

```typescript
{ name: 'ISW', url: 'https://www.understandingwar.org/rss.xml', category: 'defense' },
{ name: 'Al-Monitor', url: 'https://www.al-monitor.com/rss', category: 'mideast' },
{ name: 'The Diplomat', url: 'https://thediplomat.com/feed/', category: 'asia' },
{ name: 'CSIS', url: 'https://www.csis.org/analysis/feed', category: 'thinktank' },
{ name: 'Carnegie', url: 'https://carnegieendowment.org/rss/solr', category: 'thinktank' },
{ name: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/feed/', category: 'thinktank' },
{ name: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss', category: 'mideast' },
{ name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss', category: 'asia' },
```

**Step 3: Add domains to ALLOWED_DOMAINS in rss-proxy.js**

```javascript
'www.understandingwar.org',
'www.al-monitor.com',
'thediplomat.com',
'www.csis.org',
'carnegieendowment.org',
'www.atlanticcouncil.org',
'www.middleeasteye.net',
'asia.nikkei.com',
```

**Step 4: Commit**

```bash
git add src/config/feeds.ts api/rss-proxy.js
git commit -m "feat: expand RSS sources with defense, think tank, and regional feeds"
```

---

## Final: Verify and Push

### Task F.1: Type check and push

**Step 1: Run type check**

```bash
npm run typecheck:all
```

**Step 2: Fix any type errors that arise**

**Step 3: Push all commits**

```bash
git push origin main
```

---

## Execution Summary

| Module | Tasks | Key Files Created |
|--------|-------|-------------------|
| 1. Claude AI | 1.1–1.5 | proto/claude/, server/claude/, api/claude/, src/services/claude/ |
| 2. Social Media | 2.1–2.4 | proto/social/, server/social/, api/social/, src/services/social/ |
| 3. JP 3-60 Agent | 3.1 | Panel registration + i18n (uses Claude analyze RPC) |
| 4. NOTAM/NAVTEX | 4.1–4.2 | proto/govdata/, server/govdata/, api/govdata/, src/services/govdata/ |
| 5. Trajectory | 5.1 | proto/trajectory/, server/trajectory/, api/trajectory/, src/services/trajectory/ |
| 6. Prediction Markets | 6.1 | server/prediction/ (extends existing) |
| 7. RSS Expansion | 7.1 | feeds.ts, rss-proxy.js (config only) |

**Total: ~15 tasks, ~35 new files, ~10 modified files**
