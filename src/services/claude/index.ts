import { ClaudeServiceClient } from '../../generated/client/worldmonitor/claude/v1/service_client';
import { createCircuitBreaker } from '@/utils';
import type { SummarizeResponse, AnalyzeResponse, PredictResponse } from '../../generated/client/worldmonitor/claude/v1/service_client';

const client = new ClaudeServiceClient('', { fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args) });

const summarizeBreaker = createCircuitBreaker<SummarizeResponse>({ name: 'Claude Summarize', cacheTtlMs: 15 * 60 * 1000, persistCache: true });
const analyzeBreaker = createCircuitBreaker<AnalyzeResponse>({ name: 'Claude Analyze', cacheTtlMs: 30 * 60 * 1000, persistCache: true });
const predictBreaker = createCircuitBreaker<PredictResponse>({ name: 'Claude Predict', cacheTtlMs: 30 * 60 * 1000, persistCache: true });

const emptySum: SummarizeResponse = { summary: '', keyPoints: [], sentiment: '', provider: '', status: 'error', errorMessage: 'Circuit breaker open', inputTokens: 0, outputTokens: 0 };
const emptyAn: AnalyzeResponse = { analysis: '', keyFindings: [], riskLevel: '', status: 'error', errorMessage: 'Circuit breaker open', inputTokens: 0, outputTokens: 0 };
const emptyPred: PredictResponse = { dimensions: [], overallProbability: 0, confidence: 'low', timeframe: '', narrative: '', status: 'error', errorMessage: 'Circuit breaker open', inputTokens: 0, outputTokens: 0 };

export async function claudeSummarize(headlines: string[], region = '', lang = 'en', variant = ''): Promise<SummarizeResponse> {
  return summarizeBreaker.execute(() => client.summarize({ headlines, region, language: lang, variant }), emptySum);
}

export async function claudeAnalyze(query: string, contextData: string[], region = ''): Promise<AnalyzeResponse> {
  return analyzeBreaker.execute(() => client.analyze({ query, contextData, region }), emptyAn);
}

export async function claudePredict(scenario: string, evidence: string[], timeframe = '7d'): Promise<PredictResponse> {
  return predictBreaker.execute(() => client.predict({ scenario, evidence, timeframe }), emptyPred);
}
