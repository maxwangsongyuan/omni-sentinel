# Global OSINT Platform Map

> **Omni Sentinel Research Document**
> Last Updated: March 2026
> Purpose: Country-by-country mapping of the most important social media, messaging, and news platforms for OSINT monitoring.

---

## Table of Contents

1. [Eastern Europe & Russia](#1-eastern-europe--russia)
2. [Middle East & North Africa](#2-middle-east--north-africa)
3. [East Asia](#3-east-asia)
4. [South Asia](#4-south-asia)
5. [Southeast Asia](#5-southeast-asia)
6. [Sub-Saharan Africa](#6-sub-saharan-africa)
7. [Latin America & Caribbean](#7-latin-america--caribbean)
8. [Western Europe & North America](#8-western-europe--north-america)
9. [Central Asia](#9-central-asia)
10. [Pacific & Caribbean Small States](#10-pacific--caribbean-small-states)
11. [Summary & Analysis](#11-summary--analysis)

---

## 1. Eastern Europe & Russia

### Russia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Telegram | Messaging / Social | Primary channel for military bloggers, war correspondents, militia channels, and breaking domestic news. Russian OSINT community operates almost entirely on Telegram. | Yes (free, via Telethon/Pyrogram) |
| 2 | VKontakte (VK) | Social | 93.8M Russian users (65% of population). Local equivalent of Facebook. Used for citizen posts, regional news, community groups. | Yes (free, REST API) |
| 3 | Odnoklassniki (OK) | Social | Popular with older demographics and rural Russia. Provides insight into sentiment outside major cities. | Partial (limited API) |

**Key OSINT notes:** Russia's information environment is highly Telegram-centric for conflict/security OSINT. VK is monitored for domestic social sentiment. YouTube remains accessible and is used for long-form content. X/Twitter usage is low domestically but used by English-speaking Russia watchers. Telegram channels have faced targeted blocks in some regions since 2025, and in June 2025 Telegram itself blocked multiple OSINT-focused channels (both Ukrainian and Russian).

---

### Ukraine

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Telegram | Messaging / Social | The single most critical OSINT source for the Ukraine conflict. Military updates, air raid alerts, citizen journalism, regional administration channels all operate here. | Yes (free, via Telethon/Pyrogram) |
| 2 | Facebook | Social | ~42% of social media web traffic. Used by government officials, civil society, and for community organizing. Post-VK-ban (2017), Facebook became the dominant social network. | Partial (Meta Content Library API for researchers) |
| 3 | X (Twitter) | Social / Microblog | International OSINT community monitors Ukraine-related X accounts. English-language conflict updates, geolocated footage, and verification efforts concentrate here. | Paid ($100-$42K+/mo tiers) |

**Key OSINT notes:** VKontakte and Odnoklassniki are banned since 2017. Viber has significant usage (Ukraine is Viber's largest user base at ~24% of traffic). Signal is used by military/security personnel. GeoConfirmed, OSINTukraine, and the Eyes on Russia project are key verification/archival projects using Telegram and X as primary sources. Instagram is second-most-used social platform (~17.5% of traffic).

---

### Belarus

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Telegram | Messaging / Social | Primary opposition and independent media channel. NEXTA and similar channels broke protest news in 2020-2021 and remain critical. | Yes (free) |
| 2 | Viber | Messaging | Viber is the #1 messaging app in Belarus. Used for community groups and news distribution. | No (no public API) |
| 3 | VKontakte (VK) | Social | Still widely used given close ties with Russia. Government and state media maintain presence. | Yes (free) |

**Key OSINT notes:** Highly restricted information environment. Independent media operates primarily via Telegram from exile (Poland, Lithuania). Instagram and YouTube are used but government monitors them closely. Telegram channels NEXTA, Zerkalo, and others serve as primary independent information sources for the Belarusian diaspora and opposition.

---

### Moldova

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Most popular social network (59.1% of users). Primary platform for political discourse and news sharing. | Partial |
| 2 | YouTube | Video | 34.5% usage. Used for news consumption and political content. | Yes (YouTube Data API, free tier available) |
| 3 | Telegram | Messaging | Growing rapidly for news channels, especially Russian-language content targeting Moldovan audiences. Key vector for disinformation monitoring. | Yes (free) |

**Key OSINT notes:** Moldova is a key target of Russian information operations. Monitoring Telegram channels spreading Russian narratives is critical. Instagram usage is at 31.6%. Romanian-language and Russian-language content ecosystems operate in parallel.

---

### Georgia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Most popular social network. Primary platform for political activism, protest organization, and citizen journalism. | Partial |
| 2 | Telegram | Messaging | Growing rapidly as political communication channel, especially for opposition movements and independent media. | Yes (free) |
| 3 | YouTube | Video | Major news consumption platform. Georgian TV channels and independent media publish here. | Yes (free tier) |

**Key OSINT notes:** Georgia experienced major political unrest in 2023-2024 around the "foreign agents" law. Facebook was the primary platform for protest organization. X/Twitter is used by the international community monitoring Georgia but has low domestic penetration.

---

### Armenia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 2.4M users (83.9% of population as of Dec 2025). Dominant platform for all public discourse. | Partial |
| 2 | Telegram | Messaging / News | 500K users. Primary channel for news distribution and community information sharing. | Yes (free) |
| 3 | Instagram | Social | 800K users, growing 15% YoY. Younger demographic engagement. | Partial (Meta API) |

**Key OSINT notes:** TikTok is fastest-growing (+120% in 2024) with 400K users. The Nagorno-Karabakh conflict and its aftermath are monitored primarily via Telegram and Facebook. Armenian diaspora (large communities in Russia, USA, France) posts on Facebook and X.

---

### Azerbaijan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. Government officials and state media maintain active presence. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging app for everyday communication. | No |
| 3 | YouTube | Video | Major news and entertainment consumption platform. | Yes (free tier) |

**Key OSINT notes:** Tight government control over media. Instagram and TikTok are popular among youth. Telegram is growing as a news distribution channel. Post-Karabakh conflict content often appears on Telegram and X before local platforms.

---

## 2. Middle East & North Africa

### Iran

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Telegram | Messaging / Social | 89.5% of students use it daily. Despite periodic restrictions, it remains Iran's most important social platform for news, political discussion, and citizen journalism. | Yes (free) |
| 2 | Instagram | Social | ~24M active users (7th largest globally). Accessible without VPN (unlike most Western platforms). Primary visual social media platform. **Note: Taliban-style restrictions may spread; monitor access status.** | Partial (Meta API) |
| 3 | X (Twitter) | Social / Microblog | Blocked since 2009 but widely accessed via VPN. Critical for diaspora communication, protest movements (Woman Life Freedom), and international attention. | Paid |

**Key OSINT notes:**
- **Blocked platforms:** Facebook, YouTube, X/Twitter, WhatsApp (all require VPN)
- **Government-backed alternatives:** Rubika (50M+ users), Eitaa (40M+ users, Telegram clone), Soroush Plus (42M+ users), Bale (20.8% adoption). These are monitored by government and not trusted for sensitive communication.
- **VPN usage is widespread** despite being illegal. Common tools: Psiphon, V2Ray, Lantern, Tor.
- **Diaspora OSINT:** Iranian diaspora monitors Iran International (London-based) and Radio Farda (RFE/RL) which distribute via Telegram, YouTube, and X.
- **2026 Internet blackout:** Iran created a "US and Israel-proof internet firewall" in early 2026, further restricting access.

---

### Israel

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Telegram | Messaging / News | Rocket alert channels, military updates, citizen reporting. Heavily used during Gaza conflict for real-time updates. | Yes (free) |
| 2 | X (Twitter) | Social / Microblog | IDF and government officials post here. International OSINT community monitors Israel/Palestine primarily via X. | Paid |
| 3 | WhatsApp | Messaging | Ubiquitous in Israel for personal and group communication. News spreads virally through WhatsApp groups. | No |

**Key OSINT notes:** YouTube is the most popular platform by reach (highest penetration globally alongside Saudi Arabia and Singapore). Facebook/Instagram are widely used. Hebrew-language Telegram channels provide granular local security updates. Fake OSINT accounts on X have become a serious problem, with "verified" accounts spreading debunked IDF claims as OSINT-verified truths.

---

### Palestine (West Bank & Gaza)

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform. Used for news sharing, community updates, and citizen journalism from conflict zones. | Partial |
| 2 | WhatsApp | Messaging | Critical communication tool, especially during conflict when other infrastructure fails. | No |
| 3 | Telegram | Messaging / News | Used by various factions for communications and propaganda dissemination. Growing as news distribution channel. | Yes (free) |

**Key OSINT notes:** Snapchat has 35.2% penetration (high for the region). Internet access is frequently disrupted during military operations. Content moderation on Meta platforms has been criticized for suppressing Palestinian content. TikTok is increasingly important for younger Palestinians documenting daily life and conflict.

---

### Lebanon

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | Ubiquitous messaging platform. News and information spread primarily through WhatsApp groups. | No |
| 2 | YouTube | Video | Most popular social media platform. Lebanese news channels and political content concentrate here. | Yes (free tier) |
| 3 | Facebook | Social | Major social networking platform, used across all demographics. Political discourse and community organization. | Partial |

**Key OSINT notes:** Lebanon's sectarian media landscape means different platforms serve different communities. Telegram is used by Hezbollah-affiliated channels. X/Twitter is used by journalists and the international community. Instagram is popular among younger Lebanese. Diaspora (large communities in West Africa, Latin America, Gulf states) communicates via WhatsApp and Facebook.

---

### Syria

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Telegram | Messaging / News | Primary platform for conflict monitoring. Different factions maintain channels. Addresses local audience with day-to-day conflict impact reporting. | Yes (free) |
| 2 | Facebook | Social | Loyalist narratives tend to concentrate here due to stricter surveillance. Used for community communication in government-controlled areas. | Partial |
| 3 | WhatsApp | Messaging | Used for private group communication, refugee coordination, and information sharing about safe areas. | No |

**Key OSINT notes:** Post-Assad Syria (2025) faces a new disinformation landscape. X/Twitter reaches international audiences and contextualizes violence within the conflict's broader dynamics. YouTube is used for longer-form documentation. Diaspora communities (Turkey, Europe) use X, Facebook, YouTube, and Telegram to maintain ties.

---

### Iraq

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 20.1M users and ranks #1 for website traffic. Primary platform for political discourse and community news. | Partial |
| 2 | TikTok | Video / Social | 34.3M users -- the most users of any platform in Iraq. Rapidly growing for citizen journalism and short-form conflict content. | Partial (Research API) |
| 3 | Telegram | Messaging | Used by various militia groups, political parties, and news channels for rapid information distribution. | Yes (free) |

**Key OSINT notes:** YouTube has 22.3M users. Snapchat has 18.5M users (very high penetration). Instagram has 19M users. X/Twitter is significant for political discourse. Facebook Messenger is widely used. Iraqi Kurdistan has somewhat different platform preferences, with more Twitter usage among the political class.

---

### Yemen

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 98% of Yemeni social media users use Facebook. Primary communication and news platform. | Partial |
| 2 | WhatsApp | Messaging | Second most-used platform. Critical for communication in areas with limited connectivity. | No |
| 3 | Telegram | Messaging / News | Used by Houthi-affiliated channels and OSINT analysts monitoring the conflict. | Yes (free) |

**Key OSINT notes:** Houthis flood Western social media (Instagram, Facebook, Snapchat, YouTube, X, TikTok) with propaganda content. Houthis have periodically banned WhatsApp, Facebook, Twitter, and Telegram in their territories. Internet access is severely limited. Houthi propaganda is laced with hate speech and glorification of military capabilities. YouTube terminated ~20 Houthi-affiliated channels in 2023.

---

### Saudi Arabia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Snapchat | Social / Messaging | 20M+ users (70.5% penetration). Highest Snapchat reach globally. Used for breaking news, events, and citizen content. | No (no public API) |
| 2 | X (Twitter) | Social / Microblog | 17.12M users (66.3% penetration). Saudi Arabia is an outlier in the Middle East for X usage. Political discourse, government communication. | Paid |
| 3 | TikTok | Video / Social | 18.55M users (71.8% penetration). Rapidly growing. Used for cultural content and increasingly for news. | Partial (Research API) |

**Key OSINT notes:** YouTube has the highest penetration globally in Saudi Arabia. WhatsApp is ubiquitous for messaging. Saudi Arabia has among the highest social media engagement rates globally. Government and royal family actively use X. Content moderation and surveillance concerns are significant. Instagram is widely used.

---

### UAE (United Arab Emirates)

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Social / Messaging | Most used platform in the UAE. VoIP features were historically restricted but now accessible. | No |
| 2 | YouTube | Video | 94% penetration -- highest in the world. Primary video consumption platform. | Yes (free tier) |
| 3 | Instagram | Social | Major social platform, especially for lifestyle and commercial content. | Partial (Meta API) |

**Key OSINT notes:** UAE has the highest number of social media accounts per person globally (10.5 per user). TikTok reach is 118.5% of 18+ population. Very high digital literacy. Government surveillance is extensive. VPN usage is common but legally restricted.

---

### Egypt

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most popular platform. Major news consumption channel. | Yes (free tier) |
| 2 | Facebook | Social | Largest user base in the Arab world (50.7M users). Primary social networking and news platform. | Partial |
| 3 | Facebook Messenger | Messaging | ~33M users. Second-highest Messenger reach globally. Primary messaging platform. | Partial |

**Key OSINT notes:** TikTok is growing rapidly. WhatsApp is widely used for private communication. X/Twitter usage is declining. Government monitors social media actively; citizens have been arrested for social media posts. Egyptian diaspora (Gulf states, Europe) uses WhatsApp and Facebook for news.

---

### Libya

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant platform. Used by all factions for communication and propaganda. | Partial |
| 2 | Facebook Messenger | Messaging | 75% reach among 13+ population -- second-highest globally. | Partial |
| 3 | WhatsApp | Messaging | Widely used for group communication across the divided country. | No |

**Key OSINT notes:** Libya's split governance (Tripoli vs Benghazi) creates parallel information ecosystems. Telegram is used by various militia groups. X/Twitter is used by the international community monitoring the conflict but has low domestic penetration.

---

### Turkey

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. News, political commentary, and entertainment. | Yes (free tier) |
| 2 | Instagram | Social | 58.5M users. Primary visual social platform. Huge influencer ecosystem. | Partial (Meta API) |
| 3 | X (Twitter) | Social / Microblog | Significant for political discourse despite periodic government blocks. Breaking news often surfaces here first. | Paid |

**Key OSINT notes:** TikTok is growing rapidly. WhatsApp is the dominant messaging app. Eksi Sozluk is Turkey's Reddit equivalent (collaborative dictionary/forum) -- critical for understanding Turkish public sentiment, though it has faced multiple access bans (most recently Dec 2023). Facebook is declining among younger users but still has massive reach. Government frequently blocks or throttles platforms during crises.

---

### Jordan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most popular platform. News and entertainment consumption. | Yes (free tier) |
| 2 | Facebook | Social | Major social networking platform. Political discourse and community news. | Partial |
| 3 | Snapchat | Social / Messaging | 38.4% adult usage -- very high for the region. Popular among youth. | No |

**Key OSINT notes:** WhatsApp is ubiquitous for messaging. Instagram and TikTok are growing. Jordan is a key refugee-hosting country (Syrian, Iraqi) and social media monitoring captures refugee community dynamics.

---

### Tunisia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. Played a crucial role in the 2011 revolution and remains central to political discourse. | Partial |
| 2 | YouTube | Video | Major content consumption platform. | Yes (free tier) |
| 3 | Instagram | Social | Growing among younger users for visual content and activism. | Partial |

**Key OSINT notes:** WhatsApp and Facebook Messenger are primary messaging platforms. Tunisia has one of the more open internet environments in the MENA region, though recent political changes have introduced new pressures.

---

### Algeria

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 25.6M users. Dominant platform for all demographics. Primary news source for many Algerians. | Partial |
| 2 | YouTube | Video | Major content consumption platform. | Yes (free tier) |
| 3 | TikTok | Video / Social | Rapidly growing, especially among youth. | Partial |

**Key OSINT notes:** WhatsApp is the primary messaging platform. Instagram is growing. Algeria has experienced periodic internet shutdowns during exam periods. French and Arabic content coexist on platforms.

---

### Morocco

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | ~27M users (projected 2025). 81% of Moroccans use social media. Dominant platform. | Partial |
| 2 | YouTube | Video | Major content consumption platform. | Yes (free tier) |
| 3 | Instagram | Social | ~15M users (projected 2025). Growing rapidly for visual content and influencer culture. | Partial |

**Key OSINT notes:** WhatsApp is the primary messaging platform. TikTok is growing rapidly. Digital divide persists between urban and rural areas. French, Arabic, and Amazigh content ecosystems coexist.

---

### Qatar

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | Most popular platform by website traffic. | No |
| 2 | YouTube | Video | High penetration across all demographics. | Yes (free tier) |
| 3 | Snapchat | Social / Messaging | 39.2% adult usage -- highest Snapchat penetration globally. | No |

**Key OSINT notes:** 96.8% of Qatar's population is active on social media. TikTok, Facebook, Instagram, and LinkedIn are all widely used. Al Jazeera's social media presence is headquartered here and has massive regional influence.

---

### Kuwait

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Instagram | Social | Leading social platform among younger demographics. | Partial |
| 2 | Snapchat | Social / Messaging | Very high penetration, similar to other Gulf states. | No |
| 3 | X (Twitter) | Social / Microblog | Used for political commentary and news, especially by the diwaniya culture class. | Paid |

**Key OSINT notes:** WhatsApp is the dominant messaging app. YouTube is widely used. Kuwait has one of the highest social media penetration rates globally.

---

### Bahrain

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Instagram | Social | Leading social platform. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging platform. | No |
| 3 | YouTube | Video | High penetration for news and entertainment. | Yes (free tier) |

**Key OSINT notes:** Government surveillance of social media is extensive. Opposition activists have been targeted for social media posts. Telegram channels are monitored by security services.

---

### Oman

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most popular platform. | Yes (free tier) |
| 2 | WhatsApp | Messaging | Dominant messaging platform. | No |
| 3 | Instagram | Social | Growing social platform. | Partial |

**Key OSINT notes:** Relatively quiet social media environment compared to other Gulf states. Government maintains tight control over online discourse.

---

## 3. East Asia

### China

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WeChat (Weixin) | Messaging / Super App | 91.8% of internet users. Dominant for messaging, payments, news. Official and citizen accounts provide local news. Moments feature = citizen reporting. | No (requires Chinese phone number; API restricted to approved developers) |
| 2 | Douyin (Chinese TikTok) | Video / Social | 83% penetration. Dominant short-video platform. Citizen footage of events, protests, natural disasters surfaces here first. | Partial (Chinese business API; third-party scrapers exist) |
| 3 | Weibo | Social / Microblog | 591M MAU (March 2025). China's Twitter equivalent. Public discourse, trending topics, government announcements. Best platform for understanding Chinese public sentiment. | Partial (API requires Chinese business registration; CMU guide available) |

**Key OSINT notes:**
- **Blocked platforms:** Facebook, YouTube, X/Twitter, Instagram, WhatsApp, Telegram, Google services -- all blocked by the Great Firewall.
- **Additional platforms:** Xiaohongshu/RED (320M users, lifestyle/product reviews), Bilibili (video/anime culture), Kuaishou (short video, strong in rural areas), Toutiao (news aggregation/AI-driven), Zhihu (China's Quora), Baidu Tieba (forums).
- **OSINT challenges:** Requires Chinese phone number/SIM for most platforms. Content is heavily censored. Deleted posts may indicate sensitive topics (censorship analysis is itself an OSINT technique). International versions of apps show different content than mainland versions.
- **Diaspora:** Chinese diaspora uses WeChat (global version with different censorship rules), X/Twitter, YouTube, and increasingly Xiaohongshu.
- **Key OSINT resources:** China Digital Times, GreatFire.org, Bellingcat China investigations.

---

### Taiwan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | LINE | Messaging / Super App | 90.9% of population. Dominant messaging platform. News distribution, payments, lifestyle services all integrated. | Partial (LINE Messaging API) |
| 2 | Facebook | Social | 16.95M users. Primary social networking platform for public discourse and political discussion. | Partial |
| 3 | PTT (Bulletin Board System) | Forum | Taiwan's Reddit equivalent. Extremely influential for politics, gossip, and breaking news. Anonymous forum culture means candid public opinion. Highest usage among 35-44 age group (27.8%). | No (web scraping only; public BBS) |

**Key OSINT notes:** YouTube is most used by reach (19.2M users, 72.3%). Dcard is the younger generation's forum (45.9% usage among 18-24). Instagram is third by reach (44.7%). Threads is growing rapidly (44% usage among 18-24). TikTok and YouTube dominate time spent. Taiwan is a critical OSINT target for cross-strait tensions monitoring. Mandarin-language content analysis is essential.

---

### Japan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | LINE | Messaging / Super App | 97M MAU (75% of population). Dominant messaging and news platform. Essential for Japanese domestic communication. | Partial (LINE Messaging API) |
| 2 | X (Twitter) | Social / Microblog | Japan is one of X's largest markets globally. Real-time news, earthquake alerts, political commentary all concentrate here. | Paid |
| 3 | YouTube | Video | 78.6M MAU (60% of population). Major news and entertainment platform. | Yes (free tier) |

**Key OSINT notes:** Japan has high adoption of X/Twitter compared to most countries -- it's genuinely central to Japanese public discourse, not just international-facing. Instagram is widely used. TikTok is growing. Yahoo Japan (including Yahoo News) remains a major news portal. 5ch/2ch are anonymous forum platforms (Japan's original image/textboard culture) relevant for OSINT on extremist movements. Mastodon and Bluesky have relatively high Japanese adoption compared to other countries.

---

### South Korea

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | KakaoTalk | Messaging / Super App | 87% of Korean population. Dominant messaging, payments, taxi booking, weather -- everything integrates through Kakao ecosystem. | Partial (Kakao Developers API) |
| 2 | YouTube | Video | 44.3M users. Most popular social media platform by usage. Major news consumption channel. | Yes (free tier) |
| 3 | Naver | Search / News / Social | Korea's Google equivalent. Naver Blog, Naver Cafe (community forums), and Naver News are critical for Korean-language OSINT. | Partial (Naver Open API) |

**Key OSINT notes:** Instagram is very popular among younger demographics. X/Twitter has lower penetration than Japan but is used for political discourse. AfreecaTV is Korea's Twitch equivalent for live streaming. Korean portal sites (Naver, Daum) aggregate news and have active comment sections that reflect public sentiment. Blind (anonymous workplace social network) provides corporate insider information.

---

### North Korea

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | State-controlled intranet (Kwangmyong) | Intranet | Closed network. Less than 1% of population has internet access. No external OSINT value from domestic usage. | No |
| 2 | YouTube (Uriminzokkiri) | Video (state propaganda) | State-run channels targeting foreign audiences. KCNA Watch archives and monitors these. | Yes (YouTube API) |
| 3 | X/Facebook/Instagram (state accounts) | Social (state propaganda) | State-run accounts under "Uriminzokkiri" and other handles. Propaganda targeting foreign audiences. | Varies by platform |

**Key OSINT notes:**
- **Domestic OSINT is essentially impossible** via social media. No civilian internet access.
- **Monitoring approach:** KCNA Watch (kcnawatch.org) monitors state media. Satellite imagery (Planet, Maxar) is primary OSINT source. Defector testimony provides ground truth. 38 North provides expert analysis.
- **Anti-reactionary Thought and Culture Law (2020):** Life sentence or death for spreading foreign content. Pyongyang Cultural Language Protection Law (2023) targets South Korean slang/fonts.
- **Diaspora monitoring:** North Korean workers abroad (Russia, China, Middle East) occasionally surface on social media. South Korean platforms (YouTube, X) host defector testimonies.

---

## 4. South Asia

### India

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | 531.46M active users. India is WhatsApp's largest market. News, misinformation, political messaging all spread here first. Forward chains are a key vector. | No |
| 2 | YouTube | Video | India is YouTube's largest country audience (approaching 500M). Major news consumption and citizen journalism platform. | Yes (free tier) |
| 3 | X (Twitter) | Social / Microblog | Critical for Indian political discourse, breaking news, and OSINT. Government officials, journalists, and activists heavily use it. | Paid |

**Key OSINT notes:** Instagram (516.92M users) and Facebook (492.70M) have massive user bases. Telegram (384.06M users) is growing rapidly for news channels. ShareChat and Moj are India-specific platforms for vernacular content (28.1% penetration). Koo (Indian X/Twitter alternative, now defunct as of 2024). India has periodically restricted internet access in Kashmir and during protests. India's linguistic diversity means OSINT requires multilingual capabilities (Hindi, Tamil, Telugu, Bengali, etc.).

---

### Pakistan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | ~40M users. Dominant social platform for all demographics and political discourse. | Partial |
| 2 | YouTube | Video | ~38M users. Major news and entertainment platform. | Yes (free tier) |
| 3 | WhatsApp | Messaging | Ubiquitous messaging platform. News and political messaging spread rapidly. | No |

**Key OSINT notes:** Pakistan has a history of platform bans: TikTok was banned in May 2025 (alongside Telegram); X/Twitter was banned around the 2024 elections but restored May 2025; YouTube was banned 2012-2016. The government has proposed banning social media for users under 16. Army chief has labeled social media "vicious media." Extremely volatile regulatory environment. TikTok was previously popular before bans.

---

### Afghanistan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | Still accessible as of late 2025. Primary communication tool. | No |
| 2 | YouTube | Video | Still accessible. Used for news consumption. | Yes (free tier) |
| 3 | X (Twitter) | Social / Microblog | Still functioning. Used by journalists, diaspora, and international observers for Afghan news. | Paid |

**Key OSINT notes:**
- **Taliban restrictions (2025):** Facebook, Instagram, and Snapchat restricted on mobile data networks (accessible via fiber-optic WiFi only). TikTok banned since 2022. Two-day nationwide internet shutdown in Sept 2025.
- **VPN usage is punishable:** Soldiers randomly arrest people for having VPN apps.
- **OSINT approach:** Monitor diaspora communities (in Pakistan, Iran, Europe, North America) on X, Facebook, and YouTube. Inside Afghanistan, WhatsApp and YouTube remain most reliable. Taliban official communications appear on X and Telegram.

---

### Bangladesh

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. Primary news and political discussion platform. | Partial |
| 2 | YouTube | Video | Major content consumption platform. | Yes (free tier) |
| 3 | IMO | Messaging | Particularly strong in Bangladesh. Popular alternative to WhatsApp for video calling and messaging. | No |

**Key OSINT notes:** WhatsApp is also widely used. TikTok is growing among younger users. Bangladesh has experienced internet shutdowns during political unrest. Bigo Live is popular for live streaming. Facebook has been the primary platform for political mobilization and disinformation in Bangladesh.

---

### Sri Lanka

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 90% of internet users access news via Facebook. Dominant platform. | Partial |
| 2 | YouTube | Video | 7.23M users. Major news consumption platform. | Yes (free tier) |
| 3 | WhatsApp | Messaging | 11M users. Primary messaging platform. | No |

**Key OSINT notes:** TikTok has 5.2M users and is growing rapidly. Social media played a significant role in the 2022 economic crisis protests. Government has temporarily blocked social media during periods of unrest. Sinhala and Tamil language content require separate monitoring.

---

### Nepal

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Most widely used platform. Primary news and community communication channel. | Partial |
| 2 | TikTok | Video / Social | Rapidly gained popularity, especially among youth. Citizen journalism content. | Partial |
| 3 | YouTube | Video | Major content consumption platform. | Yes (free tier) |

**Key OSINT notes:** Hamro Patro is a unique Nepal-specific super app (calendar, news, radio, horoscope, community features) with very high local adoption. WhatsApp and Viber are used for messaging. Instagram is growing among urban youth.

---

## 5. Southeast Asia

### Myanmar

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 18.5M active users despite being blocked since Feb 2021 coup. Requires VPN. Remains dominant platform for citizen journalism and community communication. | Partial |
| 2 | TikTok | Video / Social | 21M users. Does NOT require VPN. Has overtaken Facebook in raw user numbers. Increasingly used for conflict documentation. | Partial |
| 3 | Telegram | Messaging / News | Used by resistance movements, independent media, and civil society for secure communication and news distribution. | Yes (free) |

**Key OSINT notes:**
- **Blocked platforms:** Facebook has been restricted since the Feb 2021 coup. VPN usage is criminalized.
- **Military-promoted alternatives:** MTube (YouTube clone), OKPar (Facebook clone), Myanmar Myspace (removed from Google Play). These have low adoption and are suspected military fronts.
- **Internet freedom score:** 9/100 (Freedom House 2025), down from 31 pre-coup.
- **OSINT approach:** Monitor Telegram channels of resistance forces, Facebook via VPN data, TikTok for citizen-generated conflict content. Satellite imagery is critical complement.

---

### Philippines

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Most popular platform by far. Filipinos are among the world's heaviest social media users. Facebook IS the internet for many Filipinos (via Free Basics). | Partial |
| 2 | Facebook Messenger | Messaging | Primary messaging platform, deeply integrated with Facebook. | Partial |
| 3 | TikTok | Video / Social | Rapidly growing, especially among younger generation. Used for citizen journalism and political content. | Partial |

**Key OSINT notes:** Philippines consistently ranks among the highest globally for time spent on social media. YouTube is major. X/Twitter is used more than in most SE Asian countries. Instagram is growing. Disinformation campaigns (particularly around elections) are a massive issue -- Philippines was a key testing ground for coordinated inauthentic behavior on Facebook.

---

### Indonesia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | Dominant messaging platform. Citizens cite it as their "overall favorite platform." News spreads virally through groups. | No |
| 2 | Instagram | Social | Major social platform. Widely used for news, business, and personal sharing. | Partial |
| 3 | TikTok | Video / Social | Indonesians spend ~45 hours/month on TikTok (among highest globally). Massive for citizen content. | Partial |

**Key OSINT notes:** Facebook remains significant for older demographics. Telegram is growing for news channels. YouTube is major for news consumption. Indonesia has over 270M people, making it the 4th largest country. The government has blocked platforms during periods of unrest (e.g., Papua protests). Indonesian-language content analysis is essential.

---

### Thailand

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Most widely used social platform. Political discourse and community groups. | Partial |
| 2 | LINE | Messaging | Dominant messaging platform (similar to Japan/Taiwan). Integrated with payments and news. | Partial (LINE API) |
| 3 | YouTube | Video | Second most-engaged market globally for YouTube. Major content platform. | Yes (free tier) |

**Key OSINT notes:** TikTok is rapidly growing. Instagram is popular among younger demographics. X/Twitter is used by political activists and journalists. Thailand's lese-majeste laws mean political speech is heavily policed on all platforms. Pantip is Thailand's Reddit equivalent -- an important forum for Thai public opinion.

---

### Vietnam

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 92% of internet users. Dominant social platform for all purposes. | Partial |
| 2 | Zalo | Messaging / Super App | 70M+ active users. Vietnam's WhatsApp/LINE equivalent. Developed locally by VNG Corporation. | No (no international API) |
| 3 | YouTube | Video | Major content consumption platform. Third most-used platform. | Yes (free tier) |

**Key OSINT notes:** TikTok and Instagram are growing rapidly. Vietnamese government monitors social media and has arrested citizens for posts critical of the state. Zalo is critical for understanding Vietnamese domestic communication but has no public API. Messenger is also widely used. Vietnamese-language content analysis is essential.

---

### Malaysia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | On practically every smartphone. Primary communication platform. | No |
| 2 | Facebook | Social | Major social networking platform across all demographics. | Partial |
| 3 | Instagram | Social | Ads reach 55% of adult population. Growing platform. | Partial |

**Key OSINT notes:** Telegram is growing for news channels. TikTok ranks in top 5. Malaysia is multiethnic (Malay, Chinese, Indian) so content analysis requires multiple languages. Government has increased social media regulation.

---

### Singapore

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | 74.7% of population. Dominant messaging platform. | No |
| 2 | YouTube | Video | Among highest penetration rates globally. | Yes (free tier) |
| 3 | Instagram | Social | 59% of adult population reached by ads. Major social platform. | Partial |

**Key OSINT notes:** Singapore has among the highest social media penetration globally. Facebook, TikTok, and LinkedIn are also widely used. HardwareZone Forum (HWZ) is Singapore's Reddit equivalent -- important for local sentiment. Reddit itself has relatively high adoption in Singapore. POFMA (Protection from Online Falsehoods and Manipulation Act) means government actively polices online speech.

---

### Cambodia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Overwhelmingly dominant. Facebook IS the internet in Cambodia for most users. | Partial |
| 2 | YouTube | Video | Growing content consumption platform. | Yes (free tier) |
| 3 | Telegram | Messaging | Growing for news distribution and community groups. | Yes (free) |

**Key OSINT notes:** Extremely Facebook-centric internet culture. TikTok is growing among younger users. Government monitors social media and has arrested critics. Cambodia's digital ecosystem is less diverse than neighboring countries.

---

### Laos

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. ~43% social media penetration (up from 19% in 2016). | Partial |
| 2 | YouTube | Video | Growing content platform. | Yes (free tier) |
| 3 | WhatsApp | Messaging | Used for personal and group communication. | No |

**Key OSINT notes:** Low internet penetration compared to regional peers. Government controls media. Chinese influence is growing (some Chinese platforms gaining traction among Chinese immigrant communities). Limited independent media presence online.

---

## 6. Sub-Saharan Africa

### Nigeria

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | Ubiquitous among digitally connected Nigerians. Primary news distribution via forward chains. | No |
| 2 | Facebook | Social | Dominant social platform. 103M social media users total. Political discourse and community news. | Partial |
| 3 | X (Twitter) | Social / Microblog | Nigeria has one of the most active X/Twitter communities in Africa. #EndSARS and other movements organized here. Previously banned (2021-2022). | Paid |

**Key OSINT notes:** YouTube, Instagram, and TikTok are all growing rapidly. Nigeria is Africa's largest social media market. Government has a history of platform bans (X/Twitter ban 2021-2022). Disinformation around elections is a major concern. Naija Twitter is a distinct cultural phenomenon with significant OSINT value.

---

### Ethiopia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform. Used for political activism and community communication. | Partial |
| 2 | Telegram | Messaging / News | Widely used for personal and political communication. News channels and activist groups. | Yes (free) |
| 3 | YouTube | Video | Growing content consumption platform. | Yes (free tier) |

**Key OSINT notes:** Ethiopia has experienced extended internet shutdowns during the Tigray conflict and political unrest. Government monitors social media and has arrested users. Ethnic tensions play out on social media platforms. Amharic and Tigrinya language content analysis required.

---

### Sudan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform. Used for news sharing and community updates. | Partial |
| 2 | WhatsApp | Messaging | Critical communication tool, especially during internet disruptions. | No |
| 3 | X (Twitter) | Social / Microblog | Used by diaspora and international OSINT community. Location-based tweet monitoring in Arabic is a key technique. | Paid |

**Key OSINT notes:**
- **Key OSINT projects:** Sudan War Monitor, Sudan Witness, Sudan Shahid -- all monitor and archive conflict content.
- **Internet access is severely disrupted** by the ongoing civil war. Connectivity depends on which faction controls the area.
- **YouTube is the favorite social media platform** according to some surveys.
- **Arabic-language monitoring** is essential. Diaspora communities (Egypt, Gulf states, Europe) are important secondary sources.

---

### South Sudan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 89.4% of monitored hate speech incidents occurred on Facebook. Primary platform. | Partial |
| 2 | WhatsApp | Messaging | Used for community communication and group messaging. | No |
| 3 | TikTok | Video / Social | Growing platform, increasingly used for sharing content. | Partial |

**Key OSINT notes:** Government blocked all social media for a minimum of 30 days in January 2025. X/Twitter is also used. Social media is both a tool for dialogue and a vector for hate speech and incitement. Very low internet penetration limits social media OSINT utility.

---

### Somalia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform among those with internet access. | Partial |
| 2 | YouTube | Video | Most popular social media platform according to some data. | Yes (free tier) |
| 3 | WhatsApp | Messaging | Critical communication tool, especially for diaspora connections. | No |

**Key OSINT notes:** Al-Shabaab maintains social media presence for propaganda. Internet access is limited. Somali diaspora (UK, USA, Scandinavia, Gulf states) is an important OSINT source. Telegram is used by various groups for communications.

---

### DRC (Democratic Republic of the Congo)

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform. 7.35M social media users (6.6% of population). | Partial |
| 2 | WhatsApp | Messaging | Primary messaging and communication tool. | No |
| 3 | YouTube | Video | Growing content platform. | Yes (free tier) |

**Key OSINT notes:** Internet penetration is only 30.6% -- severely limiting social media OSINT coverage. French-language content dominates. Conflict in eastern DRC (M23, various militia groups) is documented through Facebook and WhatsApp, with some Telegram usage. Radio remains a more important information source than social media for most Congolese.

---

### Kenya

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | X (Twitter) | Social / Microblog | Nairobi is called "Africa's Twitter capital." Extremely active X community for political commentary and breaking news. | Paid |
| 2 | Facebook | Social | Major social platform. 22.71M total social media users. | Partial |
| 3 | WhatsApp | Messaging | Ubiquitous messaging platform. News distributes virally. | No |

**Key OSINT notes:** YouTube, Instagram, and TikTok are all significant. Kenya has one of Africa's most sophisticated digital ecosystems. Government has used social media to coordinate responses during crises (e.g., Westgate attack). KOT (Kenyans on Twitter) is a distinct and influential online community.

---

### South Africa

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | Dominant messaging platform. News and community information spread here. | No |
| 2 | Facebook | Social | Major social networking platform across demographics. | Partial |
| 3 | Instagram | Social | Leading in adoption, especially among Gen Z and millennials. | Partial |

**Key OSINT notes:** YouTube and TikTok are growing rapidly. X/Twitter has a significant South African user base. South Africa has the most mature digital media market in Sub-Saharan Africa. English, Afrikaans, Zulu, and other languages all have significant online presence.

---

### Mali

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Most used platform among youth. Growing rapidly with 20% regular access by early 2025. | Partial |
| 2 | WhatsApp | Messaging | Most actively used for one-to-many broadcasts. Audio function is critical for illiterate populations. | No |
| 3 | X (Twitter) | Social / Microblog | Used primarily by urban, educated individuals for conflict-related news. | Paid |

**Key OSINT notes:** Russia has inundated Mali with disinformation since 2018 using local influencers on Facebook, X, WhatsApp, and Telegram. Internet access increased from 2.8% in 2012 to 35% by 2024. French and Bambara language content. Telegram is growing as a distribution channel. Wagner/Africa Corps presence is a major OSINT target.

---

### Niger

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform among those with internet access. | Partial |
| 2 | WhatsApp | Messaging | Critical messaging tool, especially for community communication. | No |
| 3 | X (Twitter) | Social / Microblog | Used by influencers and international community. Key platform during the 2023 coup. | Paid |

**Key OSINT notes:** The 2023 coup saw significant social media activity. Russian disinformation campaigns target Niger alongside Mali and Burkina Faso. Very low internet penetration. Telegram is growing.

---

### Burkina Faso

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging and audio sharing tool. | No |
| 3 | Telegram | Messaging / News | Growing as news and propaganda distribution channel. | Yes (free) |

**Key OSINT notes:** Part of the Sahel disinformation belt targeted by Russian influence operations. Military junta has restricted media access. French-language content dominates. Social media monitoring is key for tracking militant activity and government responses.

---

### Cameroon

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. | Partial |
| 2 | WhatsApp | Messaging | Primary communication tool. | No |
| 3 | YouTube | Video | Growing content platform. | Yes (free tier) |

**Key OSINT notes:** Anglophone crisis (2016-present) has generated significant social media content. Government has imposed internet shutdowns on English-speaking regions. Both English and French content need monitoring. Telegram is used by separatist groups.

---

### Mozambique

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform. | Partial |
| 2 | WhatsApp | Messaging | Dominant messaging tool. | No |
| 3 | YouTube | Video | Growing content platform. | Yes (free tier) |

**Key OSINT notes:** Cabo Delgado insurgency generates OSINT content, primarily through WhatsApp forwards and Facebook posts. Portuguese-language content. Low internet penetration limits coverage.

---

### Central African Republic

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform among limited internet users. | Partial |
| 2 | WhatsApp | Messaging | Used for communication in urban areas. | No |
| 3 | YouTube | Video | Limited but growing. | Yes (free tier) |

**Key OSINT notes:** Very low internet penetration. Russian Wagner/Africa Corps presence is significant. French and Sango language content. Radio remains the primary information source. Social media OSINT is supplementary to other intelligence sources.

---

### Chad

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform when accessible. | Partial |
| 2 | WhatsApp | Messaging | Used when not blocked. | No |
| 3 | Viber | Messaging | Alternative messaging platform. | No |

**Key OSINT notes:** Government has blocked Facebook, Twitter, WhatsApp, and Viber for extended periods. Social media access is extremely unreliable. French and Arabic language content. Radio is the dominant information medium.

---

## 7. Latin America & Caribbean

### Brazil

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | WhatsApp | Messaging | Absolutely dominant. WhatsApp IS communication in Brazil. News, politics, misinformation all spread here. | No |
| 2 | Instagram | Social | Favorite platform in Brazil. Visual content, influencers, news. | Partial |
| 3 | YouTube | Video | Major content consumption platform. | Yes (free tier) |

**Key OSINT notes:** Brazil banned X/Elon Musk's X in fall 2024, causing millions to flock to Bluesky (Brazil became one of Bluesky's top markets). X has since been restored. Facebook remains significant for older demographics. TikTok is growing rapidly. Portuguese-language content analysis required. Brazil is the largest social media market in Latin America.

---

### Mexico

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. Primary news source for many Mexicans. | Partial |
| 2 | WhatsApp | Messaging | Ubiquitous messaging platform. Critical for news distribution. | No |
| 3 | YouTube | Video | Major content consumption platform. | Yes (free tier) |

**Key OSINT notes:** X/Twitter is important for political discourse and breaking security news (cartel violence, etc.). TikTok is growing rapidly. Instagram is widely used. Monitoring narco-related content is a specific OSINT niche -- cartel groups use social media for propaganda and recruitment.

---

### Colombia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging platform. | No |
| 3 | Instagram | Social | Growing platform, especially among younger demographics. | Partial |

**Key OSINT notes:** X/Twitter is significant for political discourse. YouTube is major. Colombia's peace process and continued conflict with armed groups generates significant social media content. Monitoring both Spanish-language domestic platforms and English-language international coverage is important.

---

### Venezuela

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Leader in volume of posts across all demographics. | Partial |
| 2 | Instagram | Social | Leader in engagement density for Spanish-speaking Venezuelan users. | Partial |
| 3 | X (Twitter) | Social / Microblog | Historically very important for Venezuelan political discourse and protest movements. | Paid |

**Key OSINT notes:** Government censors independent media and platforms. Internet quality is poor. Diaspora communities (USA, Colombia, Spain) are critical OSINT sources -- they use X, Facebook, Instagram, and TikTok. CiberCuba covers Venezuelan issues alongside Cuban ones. WhatsApp is essential for domestic communication. TikTok is growing.

---

### Argentina

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Instagram | Social | Favorite platform. High engagement rates. | Partial |
| 2 | WhatsApp | Messaging | Ubiquitous messaging platform. | No |
| 3 | YouTube | Video | Major content consumption platform. | Yes (free tier) |

**Key OSINT notes:** X/Twitter is significant for Argentine political discourse (especially under Milei presidency). Facebook is declining among younger users. TikTok is growing. Argentines are among the most active social media users in Latin America.

---

### Chile

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Instagram | Social | Favorite platform alongside Argentina and Brazil. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging platform. | No |
| 3 | YouTube | Video | Major content platform. | Yes (free tier) |

**Key OSINT notes:** X/Twitter is used for political discourse. Facebook remains significant for older demographics. TikTok is growing rapidly among youth.

---

### Peru

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant platform. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging tool. | No |
| 3 | YouTube | Video | Major content platform. | Yes (free tier) |

**Key OSINT notes:** Instagram and TikTok are growing. Political instability generates significant social media content. Both urban and rural information environments differ significantly.

---

### Ecuador

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant platform. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging. | No |
| 3 | TikTok | Video / Social | Rapidly growing, especially among youth. | Partial |

**Key OSINT notes:** Security crisis (gang violence, 2024 state of emergency) generated massive social media content. X/Twitter is used for breaking security news. YouTube is significant.

---

### Cuba

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | 74.52% of social media site visits. Dominant despite connectivity issues. | Partial |
| 2 | Instagram | Social | Growing platform, accessible to those with data access. | Partial |
| 3 | YouTube | Video | Used for news and entertainment where connectivity allows. | Yes (free tier) |

**Key OSINT notes:** Internet access is limited and expensive. Government censors independent media and blocks platforms. CiberCuba is a key bridge platform connecting island and diaspora (36% US audience, 28% Cuba, 7% Spain). WhatsApp is important for messaging. Connectivity crises and power outages regularly disrupt access.

---

### Nicaragua

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging tool. | No |
| 3 | YouTube | Video | Content consumption platform. | Yes (free tier) |

**Key OSINT notes:** Ortega government restricts press freedom. Independent journalists operate from exile (primarily Costa Rica). X/Twitter and Facebook are used by diaspora and opposition. Telegram is growing as an alternative channel.

---

### Haiti

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary platform. ~22% social media penetration (low). | Partial |
| 2 | WhatsApp | Messaging | Critical communication tool. | No |
| 3 | YouTube | Video | Limited but used where connectivity allows. | Yes (free tier) |

**Key OSINT notes:** Very low social media penetration. Gang violence and security crisis is poorly documented on social media due to connectivity and safety concerns. Haitian diaspora (USA, Canada, Dominican Republic, France) provides OSINT through social media. French and Haitian Creole content. Radio remains the dominant information medium domestically.

---

## 8. Western Europe & North America

### United States

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | X (Twitter) | Social / Microblog | Despite decline, remains the primary real-time news and OSINT platform. Government officials, journalists, OSINT analysts all concentrated here. | Paid ($100-$42K+/mo) |
| 2 | Reddit | Forum / Social | De facto national forum. Subreddits provide granular local information. Increasingly important for OSINT on domestic events. | Paid ($0.24/1K calls) |
| 3 | YouTube | Video | Largest video platform. Citizen journalism, news broadcasts, live streams of events. | Yes (free tier) |

**Key OSINT notes:** Facebook/Instagram are massive but declining in OSINT utility (private groups, algorithmic feeds). TikTok is growing as a news source for younger demographics. Threads is growing (175M MAU). Bluesky is growing (5.3M MAU). Nextdoor provides hyperlocal community intelligence. Truth Social is relevant for monitoring specific political movements. Discord communities contain specialized OSINT groups.

---

### United Kingdom

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | X (Twitter) | Social / Microblog | Primary real-time news and public discourse platform. UK government and media heavily use X. | Paid |
| 2 | YouTube | Video | Major content consumption and news platform. | Yes (free tier) |
| 3 | Facebook | Social | Still widely used across demographics, especially for community groups. | Partial |

**Key OSINT notes:** Instagram, TikTok, and Snapchat are all widely used. WhatsApp is the dominant messaging app. Reddit has growing UK adoption. Bluesky has notable UK user base. Bellingcat (UK-based) is the premier OSINT organization.

---

### France

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. Major news consumption channel. | Yes (free tier) |
| 2 | Facebook | Social | Still dominant for social networking across demographics. | Partial |
| 3 | Instagram | Social | Growing, especially for younger demographics. | Partial |

**Key OSINT notes:** X/Twitter is significant for political discourse. WhatsApp and Messenger are primary messaging platforms. Snapchat has high French adoption. TikTok is growing rapidly. French-language monitoring is essential for Francophone Africa OSINT as well.

---

### Germany

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Significant, especially for older demographics and community groups. | Partial |
| 3 | Instagram | Social | Major platform for younger demographics. | Partial |

**Key OSINT notes:** WhatsApp is the dominant messaging platform. Telegram has become significant for far-right and conspiracy movements in Germany. X/Twitter is less dominant than in Anglo countries. Bluesky has notable German adoption. XING (now New Work SE) is the German LinkedIn equivalent.

---

### Italy

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Very widely used across all demographics. | Partial |
| 3 | Instagram | Social | Growing rapidly, high engagement. | Partial |

**Key OSINT notes:** WhatsApp is the dominant messaging app. Telegram has growing adoption for news channels. TikTok is growing rapidly among younger users.

---

### Spain

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | WhatsApp | Messaging | Dominant messaging platform. | No |
| 3 | Instagram | Social | Very popular, high engagement. | Partial |

**Key OSINT notes:** Facebook is still significant. X/Twitter is important for political discourse. TikTok is growing. Spanish-language monitoring is critical for Latin American OSINT.

---

### Canada

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Widely used across demographics. | Partial |
| 3 | Instagram | Social | Growing, especially younger demographics. | Partial |

**Key OSIST notes:** X/Twitter is important for political discourse and breaking news. Reddit has high Canadian adoption. WhatsApp and Messenger are primary messaging platforms. Bluesky growing among Canadian users. Canada briefly saw Meta news ban (2023-2024) which affected Facebook/Instagram news distribution.

---

### Australia

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Widely used. | Partial |
| 3 | Instagram | Social | High adoption. | Partial |

**Key OSINT notes:** X/Twitter is used for news and political discourse. Reddit has notable Australian adoption. WhatsApp and Messenger are primary messaging. TikTok is growing. Australia banned social media for under-16s in 2024.

---

### New Zealand

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Widely used. | Partial |
| 3 | Instagram | Social | Growing. | Partial |

**Key OSINT notes:** Similar platform profile to Australia. WhatsApp and Messenger for messaging. X/Twitter for real-time news.

---

### Poland

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Very widely used. 93.5% internet penetration. | Partial |
| 3 | Instagram | Social | Growing, high youth adoption. | Partial |

**Key OSINT notes:** X/Twitter is used for political discourse. Wykop is Poland's Reddit equivalent -- important for monitoring Polish public sentiment. WhatsApp and Messenger are primary messaging. Telegram is growing. Poland hosts significant Ukrainian refugee population -- monitoring Polish-language content captures cross-border dynamics.

---

### Romania

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform. | Partial |
| 2 | YouTube | Video | Major content platform. | Yes (free tier) |
| 3 | Instagram | Social | Growing. | Partial |

**Key OSINT notes:** Lowest social media adoption rate in Europe (40.5%). WhatsApp and Messenger for messaging. TikTok played a controversial role in the 2024 presidential election. X/Twitter has lower adoption.

---

### Sweden

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. 80.3% social media adoption. | Yes (free tier) |
| 2 | Facebook | Social | Widely used, especially for groups and communities. | Partial |
| 3 | Instagram | Social | High adoption. | Partial |

**Key OSINT notes:** WhatsApp is primary messaging. X/Twitter is used by journalists and politicians. Flashback Forum is Sweden's primary online forum (important for monitoring extremist content). TikTok and Snapchat have high youth adoption.

---

### Norway

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Very widely used across demographics. | Partial |
| 3 | Snapchat | Social / Messaging | Very high penetration among younger demographics. | No |

**Key OSINT notes:** Instagram is widely used. X/Twitter is significant for news. WhatsApp is primary messaging.

---

### Finland

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. 81% social media adoption. | Yes (free tier) |
| 2 | Facebook | Social | Widely used. | Partial |
| 3 | Instagram | Social | Growing. | Partial |

**Key OSINT notes:** WhatsApp is dominant for messaging. Suomi24 is Finland's main online discussion forum. X/Twitter is used by media and politicians. Finland's NATO membership (2023) makes monitoring information operations relevant.

---

### Netherlands

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | WhatsApp | Messaging | Dominant messaging platform. | No |
| 3 | Instagram | Social | High engagement. Users spend 2h18m/day on social media. | Partial |

**Key OSINT notes:** Facebook is widely used for groups. X/Twitter is significant for news. LinkedIn has very high adoption. Dumpert is a popular Dutch video/content platform. Bellingcat is partly based in the Netherlands.

---

### Belgium

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Widely used across demographics. | Partial |
| 3 | Instagram | Social | Growing. | Partial |

**Key OSINT notes:** Bilingual country (French/Dutch) requires dual-language monitoring. WhatsApp is primary messaging. HLN.be comments section is an informal forum for Flemish public opinion.

---

### Greece

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | YouTube | Video | Most used platform. | Yes (free tier) |
| 2 | Facebook | Social | Widely used. | Partial |
| 3 | Viber | Messaging | Greece is one of only four countries where Viber is the #1 messaging app. | No |

**Key OSINT notes:** Instagram is growing. X/Twitter is used for news. WhatsApp is secondary to Viber. Greek-language monitoring required. Migration-related OSINT often involves Greek platforms.

---

### Balkans (Serbia, Croatia, Bosnia & Herzegovina, Kosovo, North Macedonia, Albania, Montenegro)

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant across the region. Primary platform for news and political discourse. | Partial |
| 2 | Viber | Messaging | Viber is the #1 messaging app in Serbia and Bulgaria. Very high penetration across the region. | No |
| 3 | YouTube | Video | Major content consumption platform. | Yes (free tier) |

**Key OSINT notes:** Instagram and TikTok are growing rapidly across the region. X/Twitter is used by political elites and journalists. Serbia is the most affected by Russian disinformation in the Western Balkans. Each country has distinct language considerations. North Macedonia was a major source of election disinformation targeting the US in 2016. Reddit-like local forums exist but are less influential than in Nordic/Baltic countries.

---

## 9. Central Asia

### Kazakhstan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Instagram | Social | 13.1M users (63% of population). Most influential platform. | Partial |
| 2 | WhatsApp | Messaging | Leading communications app. 80%+ of population uses social networks. | No |
| 3 | TikTok | Video / Social | Dominant in usage time. Growing rapidly. | Partial |

**Key OSINT notes:** YouTube is widely used for content consumption. Telegram is growing as a news distribution channel. Russian-language and Kazakh-language content coexist. The January 2022 unrest was heavily documented on social media. VKontakte retains some users due to Russian cultural ties.

---

### Uzbekistan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Telegram | Messaging / Social | 88% adoption rate. Primary communication and news platform. Uzbekistan is one of the most Telegram-dominant countries globally. | Yes (free) |
| 2 | Instagram | Social | Top social platform for visual content and news. | Partial |
| 3 | YouTube | Video | Growing content consumption platform. | Yes (free tier) |

**Key OSINT notes:** Uzbek and Russian language content. Government has modernized under Mirziyoyev but still monitors social media. Facebook has lower penetration than in neighboring countries. TikTok is growing among younger users.

---

### Kyrgyzstan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Instagram | Social | Main news-sharing network. Primary social platform. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging app (similar to Kazakhstan). | No |
| 3 | YouTube | Video | Major content platform. | Yes (free tier) |

**Key OSINT notes:** Kyrgyzstan has experienced multiple political upheavals documented on social media. Telegram is growing for news channels. Russian and Kyrgyz language content. Facebook has some adoption.

---

### Tajikistan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Primary social platform. | Partial |
| 2 | Telegram | Messaging | Growing communication platform. | Yes (free) |
| 3 | YouTube | Video | Content consumption. | Yes (free tier) |

**Key OSINT notes:** Government restricts internet access. Social media penetration is relatively low. Russian and Tajik language content. Monitoring diaspora communities (large Tajik labor migration to Russia) provides important OSINT.

---

### Turkmenistan

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | VPN-accessed platforms | Various | Most social media platforms are blocked. Citizens use VPNs to access YouTube, Instagram, and messaging apps. | N/A |
| 2 | YouTube | Video | Accessible in some contexts. Primary content platform. | Yes (free tier) |
| 3 | IMO | Messaging | Reported as a common messaging alternative in Central Asia. | No |

**Key OSINT notes:** One of the world's most closed information environments. Internet is heavily censored and slow. Domestic media is entirely state-controlled. Diaspora communities (Turkey, Russia) are the primary OSINT source. Radio Free Europe/Radio Liberty's Turkmen service provides independent coverage.

---

## 10. Pacific & Caribbean Small States

### Pacific Islands (Fiji, Papua New Guinea, Samoa, Tonga, etc.)

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant platform across Pacific islands. Primary news and community platform. | Partial |
| 2 | WhatsApp | Messaging | Used for personal communication and community groups. | No |
| 3 | YouTube | Video | Content consumption where bandwidth allows. | Yes (free tier) |

**Key OSINT notes:** Low internet penetration in many Pacific nations. Facebook is often the primary internet experience. Diaspora communities (Australia, New Zealand) are important information sources. Chinese influence operations targeting Pacific islands are a growing OSINT concern.

---

### Caribbean States (Jamaica, Trinidad & Tobago, Dominican Republic, etc.)

| Rank | Platform | Type | Why It Matters for OSINT | API Available? |
|------|----------|------|--------------------------|----------------|
| 1 | Facebook | Social | Dominant social platform across the Caribbean. | Partial |
| 2 | WhatsApp | Messaging | Primary messaging tool. | No |
| 3 | Instagram | Social | Growing, especially in more connected countries. | Partial |

**Key OSINT notes:** YouTube and TikTok are growing. X/Twitter usage varies by country but is generally lower than in Latin America. Diaspora communities (USA, UK, Canada) are important secondary sources. English, Spanish, French, and Creole content depending on country.

---

## 11. Summary & Analysis

### Global Platform Frequency Table

How many countries/territories have each platform in the top 3 for OSINT monitoring:

| Rank | Platform | Countries in Top 3 | Primary Type |
|------|----------|-------------------|--------------|
| 1 | **Facebook** | ~120+ | Social |
| 2 | **YouTube** | ~80+ | Video |
| 3 | **WhatsApp** | ~65+ | Messaging |
| 4 | **Instagram** | ~40+ | Social |
| 5 | **Telegram** | ~35+ | Messaging/News |
| 6 | **X (Twitter)** | ~25+ | Social/Microblog |
| 7 | **TikTok** | ~15+ | Video/Social |
| 8 | **Snapchat** | ~8 | Social/Messaging |
| 9 | **LINE** | 3 (Japan, Taiwan, Thailand) | Messaging |
| 10 | **Viber** | 5 (Belarus, Bulgaria, Greece, Serbia, Ukraine) | Messaging |
| 11 | **VKontakte (VK)** | 2 (Russia, Belarus) | Social |
| 12 | **KakaoTalk** | 1 (South Korea) | Messaging |
| 13 | **WeChat** | 1 (China) | Messaging/Super App |
| 14 | **Douyin** | 1 (China) | Video |
| 15 | **Weibo** | 1 (China) | Social/Microblog |
| 16 | **Zalo** | 1 (Vietnam) | Messaging |
| 17 | **PTT** | 1 (Taiwan) | Forum |
| 18 | **Naver** | 1 (South Korea) | Search/News |
| 19 | **Facebook Messenger** | 3 (Egypt, Libya, Philippines) | Messaging |
| 20 | **Reddit** | 1 (USA) | Forum |

---

### Platform Priority for Omni Sentinel Integration

Based on global frequency, API availability, and OSINT value, here is the recommended integration priority:

#### Tier 1: Must-Have (Integrate First)

| Priority | Platform | Rationale | API Cost | Integration Difficulty |
|----------|----------|-----------|----------|----------------------|
| **1** | **Telegram** | Best API access of any major platform. Critical for conflict zones (Ukraine, Russia, Middle East, Myanmar). Free API via Telethon/Pyrogram. 35+ countries in top 3. | Free | Low |
| **2** | **X (Twitter)** | Despite API costs, remains the global OSINT standard. Real-time, geotagged, searchable. OSINT community lives here. | $100-$42K/mo (official); $0.15/1K tweets via alternatives like TwitterAPI.io) | Medium |
| **3** | **YouTube** | Free API, 80+ countries in top 3. Video evidence, citizen journalism, news broadcasts. Geotagged content. | Free tier available | Low |
| **4** | **Facebook / Meta** | 120+ countries in top 3. CrowdTangle is dead (Aug 2024), but Meta Content Library API available for researchers. | Partial (researcher access) | High |

#### Tier 2: High Priority

| Priority | Platform | Rationale | API Cost | Integration Difficulty |
|----------|----------|-----------|----------|----------------------|
| **5** | **Reddit** | Critical for US/Anglosphere OSINT. Subreddit-level granularity. | $0.24/1K API calls | Medium |
| **6** | **TikTok** | 15+ countries in top 3, growing fastest globally. Citizen journalism content. | Research API (application required) | High |
| **7** | **VKontakte (VK)** | Essential for Russia/Belarus OSINT. Free, well-documented API. | Free | Low |
| **8** | **Instagram** | 40+ countries. Visual OSINT (protest footage, geotagged photos). Meta API restrictions apply. | Partial (Meta API) | High |

#### Tier 3: Regional Essentials

| Priority | Platform | Rationale | API Cost | Integration Difficulty |
|----------|----------|-----------|----------|----------------------|
| **9** | **Weibo** | Essential for China OSINT. Requires Chinese phone/business registration. | Partial (Chinese registration) | Very High |
| **10** | **LINE** | Critical for Japan, Taiwan, Thailand (3 strategically important countries). | Partial (LINE API) | Medium |
| **11** | **KakaoTalk** | Essential for South Korea monitoring. | Partial (Kakao API) | Medium |
| **12** | **Naver** | Korea's Google. News, blogs, cafes (forums). | Partial (Open API) | Medium |
| **13** | **PTT** | Taiwan's most influential forum. Web scraping only. | No (scraping) | Medium |
| **14** | **Bluesky** | Growing alternative to X. Open AT Protocol provides excellent API access. Strong in US, UK, Germany, Japan, Brazil. | Free (AT Protocol) | Low |

#### Tier 4: Monitor But Challenging to Integrate

| Priority | Platform | Rationale | Challenges |
|----------|----------|-----------|-----------|
| **15** | **WhatsApp** | 65+ countries in top 3. Dominant messaging globally. | No public API. End-to-end encrypted. Monitoring requires group membership. Business API only for authorized businesses. |
| **16** | **WeChat** | Essential for China. 91.8% of Chinese internet users. | Requires Chinese phone number. Heavily censored. No foreign developer API access. |
| **17** | **Douyin** | Chinese TikTok. 83% penetration. | Separate from international TikTok. Requires Chinese access. Third-party scrapers exist. |
| **18** | **Snapchat** | Top 3 in Gulf states (Saudi, Qatar, Jordan). | No public API for content access. Ephemeral content. |
| **19** | **Viber** | Top messaging app in 4-5 countries (Belarus, Bulgaria, Greece, Serbia). | No public API. |
| **20** | **Zalo** | Essential for Vietnam (70M+ users). | No international API. Vietnamese-only. |

---

### Regional Platform Clusters

Countries grouped by similar platform profiles for efficient monitoring strategy:

#### Cluster 1: "Telegram-Dominant" (Conflict/Authoritarian)
**Countries:** Russia, Ukraine, Belarus, Uzbekistan, Iran, Syria, Ethiopia
**Strategy:** Telegram channel monitoring is the single highest-value activity. Use Telethon/Pyrogram for automated collection. Monitor channel creation/deletion as censorship indicators.

#### Cluster 2: "Facebook-Is-The-Internet" (Developing World)
**Countries:** Philippines, Cambodia, Myanmar, most of Sub-Saharan Africa, Haiti, Pacific Islands
**Strategy:** Facebook is the entire social media ecosystem. Meta Content Library API (if accessible) or web monitoring. WhatsApp forwards complement Facebook content.

#### Cluster 3: "WhatsApp-First" (Latin America, South Asia, parts of Africa)
**Countries:** Brazil, India, Indonesia, Malaysia, Nigeria, South Africa, Kenya, most of Latin America
**Strategy:** WhatsApp is the hardest to monitor programmatically. Focus on secondary platforms where WhatsApp content surfaces (screenshots posted to X/Twitter, Facebook, Reddit). Monitor WhatsApp-linked web content.

#### Cluster 4: "WeChat/Chinese Ecosystem" (Greater China)
**Countries:** China (mainland)
**Strategy:** Requires dedicated Chinese-language team with Chinese phone numbers. Monitor Weibo (most open), Douyin (video content), WeChat (messaging). Use censorship analysis tools. Cross-reference with diaspora posts on X/Twitter and YouTube.

#### Cluster 5: "Super App Messaging" (East Asia)
**Countries:** Japan (LINE), South Korea (KakaoTalk), Taiwan (LINE), Thailand (LINE)
**Strategy:** These platforms combine messaging, news, payments, and community features. Requires platform-specific API integration. News features within these apps are key OSINT sources.

#### Cluster 6: "X/Twitter-Centric" (Anglosphere + Japan)
**Countries:** USA, UK, Japan, Kenya, Nigeria, Saudi Arabia
**Strategy:** X/Twitter is genuinely central to public discourse (not just used by elites). Invest in X API access or alternatives. Real-time monitoring with keyword/geolocation filters.

#### Cluster 7: "YouTube-as-News" (MENA, Western Europe)
**Countries:** Egypt, Jordan, Oman, Lebanon, France, Germany, Italy, Spain
**Strategy:** YouTube is the primary news consumption platform. Monitor news channels, comments, and citizen-uploaded content. YouTube Data API is free and well-documented.

#### Cluster 8: "Gulf Snapchat" (Arabian Peninsula)
**Countries:** Saudi Arabia, Qatar, UAE, Kuwait, Bahrain, Jordan
**Strategy:** Snapchat has uniquely high penetration. Content is ephemeral, making real-time monitoring essential. No public API -- this is a gap.

#### Cluster 9: "VPN-Dependent" (Authoritarian States)
**Countries:** Iran, China, North Korea, Turkmenistan, Myanmar (partial)
**Strategy:** Citizens use VPNs to access blocked platforms. Monitor both the blocked platforms (via diaspora content) and the government-approved alternatives. Censorship itself is an intelligence signal.

#### Cluster 10: "Viber Belt" (Eastern Europe/Balkans)
**Countries:** Belarus, Bulgaria, Greece, Serbia, Ukraine
**Strategy:** Viber has 70% penetration in CEE/CIS. No public API, but Viber communities can be monitored manually. Important complement to Telegram monitoring.

---

### Data Sources & References

This research draws from the following sources:

- [DataReportal Digital 2025 Reports](https://datareportal.com/) -- Country-by-country digital and social media statistics
- [Statista](https://www.statista.com/) -- Social media usage statistics by country
- [StatCounter Global Stats](https://gs.statcounter.com/) -- Social media market share by country
- [World Population Review](https://worldpopulationreview.com/country-rankings/social-media-users-by-country) -- Social media users by country
- [Bellingcat](https://www.bellingcat.com/) -- OSINT methodology and China research challenges
- [OSINTukraine](https://osintukraine.com/) -- Ukraine conflict OSINT tools and sources
- [GeoConfirmed](https://geoconfirmed.org/) -- Geolocation verification of conflict content
- [Sudan War Monitor](https://sudanwarmonitor.com/) -- Sudan conflict OSINT
- [Carnegie Endowment](https://carnegieendowment.org/) -- Digital communication as weapon (Mali)
- [Freedom House](https://freedomhouse.org/) -- Internet freedom by country
- [Meltwater](https://www.meltwater.com/) -- Social media statistics by region
- [KCNA Watch](https://kcnawatch.org/) -- North Korea state media monitoring
- [38 North](https://www.38north.org/) -- North Korea analysis
- [Telegram OSINT Toolbox](https://github.com/The-Osint-Toolbox/Telegram-OSINT) -- Telegram OSINT tools and techniques
- [OSINT Industries](https://www.osint.industries/) -- API access for OSINT
- [cipher387 OSINT APIs](https://github.com/cipher387/API-s-for-OSINT) -- Comprehensive list of OSINT APIs
- [Social Media OSINT Tools Collection](https://github.com/osintambition/Social-Media-OSINT-Tools-Collection) -- Curated OSINT tool list
- [Go-Globe](https://www.go-globe.com/) -- Middle East social media statistics
- [Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/) -- Messaging app popularity by country
- [Filterwatch](https://filter.watch/) -- Iran's domestic messaging apps analysis
- [ReliefWeb](https://reliefweb.int/) -- Sahel social media monitoring reports

---

### Methodology Notes

1. **Data recency:** Primary data from DataReportal Digital 2025 reports, Statista 2024-2025 surveys, and StatCounter 2024-2025 data. Some conflict zone data is from 2023-2024 due to limited recent surveys.
2. **OSINT prioritization:** Platforms are ranked by OSINT utility, not just raw popularity. A platform with 10M users where citizens post conflict footage may rank higher than one with 50M users used primarily for entertainment.
3. **API availability:** Assessed as of early 2026. Platform API policies change frequently. "Partial" means API exists but access is restricted (researcher applications, paid tiers, geographic restrictions).
4. **Gaps and uncertainties:** Data for some smaller/less-connected countries (Turkmenistan, Central African Republic, Pacific islands) is limited. Where specific data was unavailable, regional patterns were used as proxies and noted accordingly.
5. **Language considerations:** Effective OSINT monitoring requires language capabilities matching the target country. This document notes where multilingual monitoring is especially important.
