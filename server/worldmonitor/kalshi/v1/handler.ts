import type {
  KalshiServiceHandler,
  ServerContext,
  ListKalshiMarketsRequest,
  ListKalshiMarketsResponse,
} from '../../../../src/generated/server/worldmonitor/kalshi/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { fetchKalshiMarkets, filterKalshiMarkets } from './kalshi';

const REDIS_CACHE_KEY = 'kalshi:markets:v1';
const REDIS_CACHE_TTL = 600; // 10 min

const listKalshiMarketsHandler: KalshiServiceHandler['listKalshiMarkets'] = async (
  _ctx: ServerContext,
  req: ListKalshiMarketsRequest,
): Promise<ListKalshiMarketsResponse> => {
  try {
    const pageSize = Math.max(1, Math.min(100, req.pageSize || 50));
    const cacheKey = `${REDIS_CACHE_KEY}:${req.category || 'all'}:${req.query || ''}:${pageSize}:${req.cursor || ''}`;

    const result = await cachedFetchJson<ListKalshiMarketsResponse>(
      cacheKey,
      REDIS_CACHE_TTL,
      async () => {
        const fetched = await fetchKalshiMarkets(pageSize, req.cursor || undefined);
        if (!fetched) return null;

        let markets = fetched.markets;
        if (req.query || req.category) {
          markets = filterKalshiMarkets(markets, req.query, req.category || undefined);
        }

        if (markets.length === 0) return null;

        return {
          markets,
          pagination: fetched.cursor
            ? { nextCursor: fetched.cursor, totalCount: 0 }
            : undefined,
        };
      },
    );

    return result || { markets: [], pagination: undefined };
  } catch {
    return { markets: [], pagination: undefined };
  }
};

export const kalshiHandler: KalshiServiceHandler = {
  listKalshiMarkets: listKalshiMarketsHandler,
};
