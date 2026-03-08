# Tavily Unified Search — Design Document

> Date: 2026-03-07
> Status: Approved
> Module: Intelligence Assistant (intel/v1)

---

## Summary

Add three new tools to the Intelligence Assistant's 61-tool registry, enabling Claude to search the public web, extract full article content, and verify social media claims against authoritative sources.

## Motivation

The Intelligence Assistant currently has tools for structured data (ACLED, GDELT, Kalshi) and social media (Twitter, Reddit, YouTube, etc.), but cannot search the open web. This means:

- No access to news articles, think tank reports, or government statements outside RSS feeds
- No way to verify social media claims against authoritative reporting
- No way to research topics not covered by existing structured APIs

Tavily fills this gap as the "universal fallback" — when the 61 specialized tools can't find what's needed, Claude can search the public internet.

## Design

### Three New Tools

#### 1. `web_search`

Search the public internet for news, reports, and general information.

```
Input:
  - query (string, required): Search keywords
  - topic ("general" | "news"): Search type, default "news"
  - time_range ("day" | "week" | "month" | "year"): Time filter
  - include_domains (string[]): Domain allowlist (optional)
  - search_depth ("basic" | "advanced"): Depth, default "basic"

Output:
  - results[]: { title, url, content, score, published_date }
  - answer: Tavily-generated brief answer (optional)

Cost: 1 credit (basic) / 2 credits (advanced)
```

#### 2. `web_extract`

Extract full article content from URLs found via `web_search`.

```
Input:
  - urls (string[], required): URLs to extract (max 5)

Output:
  - results[]: { url, raw_content (markdown), images }
  - failed_results[]: { url, error }

Cost: 1 credit per call
```

#### 3. `verify_claim`

Verify a specific claim from social media or other unconfirmed sources.

```
Input:
  - claim (string, required): The claim to verify
  - source (string): Where the claim came from (e.g., "Twitter @IntelDoge")

Output:
  - status: "corroborated" | "unverified"
  - evidence[]: { title, url, snippet, score: number }
  - summary: One-line verification conclusion

Internal logic:
  1. Extract keywords from claim
  2. Call Tavily search (topic: "news", time_range: "week")
  3. Analyze results:
     - Matching reports found + content aligns → "corroborated"
     - No relevant reports found → "unverified"

Cost: 1 credit per call
```

### System Prompt Addition

Append to `CHAT_SYSTEM_PROMPT`:

```
网页搜索与验证规则：
- 当用户研究某个话题/人物/事件时，使用 web_search 搜索公开互联网补充信息
- 当从社交媒体工具（list_tweets, list_reddit_posts, list_vk_posts 等）获取到具体声明或事件报告时，使用 verify_claim 验证其真实性
- 验证结果用以下格式标注：
  ✅ 已验证: [来源] 报道确认
  ⚠️ 未验证: 仅社交媒体来源，未找到权威报道
  ❌ 存疑: 与 [来源] 的报道矛盾
- 需要深入阅读某篇文章全文时，使用 web_extract 提取内容
- web_search 优先搜索新闻源（topic: "news"），研究性问题用 "general"
```

### Data Flow

```
User: "伊朗最近有什么军事动向？Twitter 上说部署了新导弹？"

Claude decision (within 5 tool turns):

Turn 1 (parallel):
  ├─ list_tweets(query: "Iran missile deployment")
  ├─ list_acled_events(country: "Iran")
  └─ web_search(query: "Iran military March 2026", topic: "news")

Turn 2 (verification):
  └─ verify_claim(
       claim: "Iran deployed new missiles in Syria",
       source: "Twitter @IntelDoge"
     )

Turn 3 (optional deep read):
  └─ web_extract(urls: ["https://reuters.com/article/..."])

Turn 4-5: Claude synthesizes and responds with verification labels.
```

### Files Changed

| File | Change |
|------|--------|
| `server/worldmonitor/intel/v1/tools.ts` | Add 3 `register()` calls (~100 lines) |
| `server/worldmonitor/intel/v1/system-prompts.ts` | Append verification rules to `CHAT_SYSTEM_PROMPT` |
| `.env.example` | Add `TAVILY_API_KEY` documentation |

### Files NOT Changed

- No new proto definitions needed
- No new edge functions needed (reuses existing `/api/intel/v1/chat`)
- No frontend changes needed
- No changes to `chat.ts` or `briefing.ts` (tool loop unchanged)

### Cost Estimate

```
Tavily free tier: 1,000 credits/month

Per conversation: ~2 credits (1 search + 0.5 verify + 0.2 extract avg)
Per briefing: ~3 credits (2 searches + 1 verify)

Free tier supports: ~400 conversations/month or ~300 briefings/month
```

### Graceful Degradation

- `TAVILY_API_KEY` not set → tools return `{ error: "Web search not configured" }`
- Other 61 tools continue to work normally
- Claude will note "web search unavailable" and rely on existing tools

### Security

- `TAVILY_API_KEY` stored in `process.env` (server-side only)
- No user-supplied URLs passed to Extract without Tavily's built-in safety layer
- Tavily includes PII leakage prevention and prompt injection blocking
- All results rendered as `textContent` (no innerHTML) in frontend

---

## Future: Real-Time Streaming (Deferred)

> Tracked in GitHub issue (to be created).

SSE/WebSocket architecture for pushing breaking news and alerts to the browser in real-time. Not needed for MVP — current SmartPollLoop intervals are sufficient.
