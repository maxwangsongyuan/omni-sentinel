import type {
  MetaculusServiceHandler,
  ServerContext,
  ListMetaculusQuestionsRequest,
  ListMetaculusQuestionsResponse,
} from '../../../../src/generated/server/worldmonitor/metaculus/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { fetchMetaculusQuestions, filterMetaculusQuestions } from './metaculus';

const REDIS_CACHE_KEY = 'metaculus:questions:v1';
const REDIS_CACHE_TTL = 600; // 10 min

const listMetaculusQuestionsHandler: MetaculusServiceHandler['listMetaculusQuestions'] = async (
  _ctx: ServerContext,
  req: ListMetaculusQuestionsRequest,
): Promise<ListMetaculusQuestionsResponse> => {
  try {
    const pageSize = Math.max(1, Math.min(100, req.pageSize || 20));
    const offset = req.cursor ? parseInt(req.cursor, 10) || 0 : 0;
    const cacheKey = `${REDIS_CACHE_KEY}:${req.category || 'all'}:${req.query || ''}:${pageSize}:${offset}`;

    const result = await cachedFetchJson<ListMetaculusQuestionsResponse>(
      cacheKey,
      REDIS_CACHE_TTL,
      async () => {
        const fetched = await fetchMetaculusQuestions(pageSize, offset);
        if (!fetched) return null;

        let questions = fetched.questions;
        if (req.query || req.category) {
          questions = filterMetaculusQuestions(questions, req.query, req.category || undefined);
        }

        if (questions.length === 0) return null;

        return {
          questions,
          pagination: fetched.nextOffset !== null
            ? { nextCursor: String(fetched.nextOffset), totalCount: fetched.totalCount }
            : { nextCursor: '', totalCount: fetched.totalCount },
        };
      },
    );

    return result || { questions: [], pagination: undefined };
  } catch {
    return { questions: [], pagination: undefined };
  }
};

export const metaculusHandler: MetaculusServiceHandler = {
  listMetaculusQuestions: listMetaculusQuestionsHandler,
};
