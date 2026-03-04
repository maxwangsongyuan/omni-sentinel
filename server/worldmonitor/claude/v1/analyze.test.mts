import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { handleAnalyze } from './analyze.ts';

describe('handleAnalyze', () => {
  let mockFetch: ReturnType<typeof mock.fn>;
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.CLAUDE_API_KEY;

  beforeEach(() => {
    mockFetch = mock.fn(() => Promise.resolve({
      ok: false, status: 500, json: () => Promise.resolve({}),
    }));
    globalThis.fetch = mockFetch as any;
    process.env.CLAUDE_API_KEY = 'test-key';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env.CLAUDE_API_KEY = originalEnv;
    } else {
      delete process.env.CLAUDE_API_KEY;
    }
  });

  it('returns analysis from Claude API using Sonnet model', async () => {
    mockFetch.mock.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        content: [{ type: 'text', text: '{"analysis":"Deep analysis","key_findings":["f1","f2"],"risk_level":"high"}' }],
        usage: { input_tokens: 200, output_tokens: 150 },
      }),
    }));
    const result = await handleAnalyze({ query: 'Middle East tensions', contextData: ['data1'], region: 'MENA' });
    assert.strictEqual(result.analysis, 'Deep analysis');
    assert.deepStrictEqual(result.keyFindings, ['f1', 'f2']);
    assert.strictEqual(result.riskLevel, 'high');
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.inputTokens, 200);
    assert.strictEqual(result.outputTokens, 150);
    // Verify Sonnet model used
    const body = JSON.parse(mockFetch.mock.calls[0].arguments[1].body);
    assert.ok(body.model.includes('sonnet'), `Expected model to include 'sonnet', got: ${body.model}`);
  });

  it('returns error status when API key missing', async () => {
    delete process.env.CLAUDE_API_KEY;
    const result = await handleAnalyze({ query: 'test', contextData: [], region: '' });
    assert.strictEqual(result.status, 'error');
    assert.ok(result.errorMessage.length > 0);
  });

  it('returns error status on API failure', async () => {
    mockFetch.mock.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 429 }));
    const result = await handleAnalyze({ query: 'test', contextData: [], region: '' });
    assert.strictEqual(result.status, 'error');
    assert.ok(result.errorMessage.includes('429'));
  });

  it('uses max_tokens of 2048 for deeper analysis', async () => {
    mockFetch.mock.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        content: [{ type: 'text', text: '{"analysis":"a","key_findings":[],"risk_level":"low"}' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    }));
    await handleAnalyze({ query: 'test', contextData: [], region: '' });
    const body = JSON.parse(mockFetch.mock.calls[0].arguments[1].body);
    assert.strictEqual(body.max_tokens, 2048);
  });

  it('handles timeout via AbortController', async () => {
    mockFetch.mock.mockImplementationOnce((_url: string, opts: any) => {
      assert.ok(opts.signal instanceof AbortSignal, 'Should pass an AbortSignal');
      return Promise.reject(new Error('The operation was aborted'));
    });
    const result = await handleAnalyze({ query: 'test', contextData: [], region: '' });
    assert.strictEqual(result.status, 'error');
    assert.ok(result.errorMessage.includes('aborted'));
  });
});
