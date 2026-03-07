import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_DEFINITIONS, executeToolCall } from './tools.ts';

describe('tool registry', () => {
  it('exports at least 30 tool definitions', () => {
    assert.ok(TOOL_DEFINITIONS.length >= 30, `Expected >= 30 tools, got ${TOOL_DEFINITIONS.length}`);
  });

  it('every tool has name, description, and input_schema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      assert.ok(tool.name, `Tool missing name`);
      assert.ok(tool.description, `Tool ${tool.name} missing description`);
      assert.ok(tool.input_schema, `Tool ${tool.name} missing input_schema`);
      assert.strictEqual(tool.input_schema.type, 'object', `Tool ${tool.name} schema type should be object`);
    }
  });

  it('tool names are unique', () => {
    const names = TOOL_DEFINITIONS.map(t => t.name);
    const unique = new Set(names);
    assert.strictEqual(names.length, unique.size, `Duplicate tool names found`);
  });

  it('tool names use snake_case', () => {
    for (const tool of TOOL_DEFINITIONS) {
      assert.ok(/^[a-z][a-z0-9_]*$/.test(tool.name), `Tool name ${tool.name} should be snake_case`);
    }
  });

  it('executeToolCall returns error object for unknown tool', async () => {
    const result = await executeToolCall('nonexistent_tool', {});
    assert.ok(typeof result === 'object');
    assert.ok('error' in (result as any));
  });
});

describe('web_search tool', () => {
  it('web_search is registered', () => {
    const tool = TOOL_DEFINITIONS.find(t => t.name === 'web_search');
    assert.ok(tool, 'web_search tool should be registered');
    assert.ok(tool!.description.length > 0);
    assert.ok(tool!.input_schema.properties.query, 'should have query param');
  });

  it('web_search returns error when TAVILY_API_KEY is missing', async () => {
    const original = process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_API_KEY;
    try {
      const result = await executeToolCall('web_search', { query: 'test' }) as any;
      assert.ok(result.error || result.status === 'not_configured');
    } finally {
      if (original) process.env.TAVILY_API_KEY = original;
    }
  });
});

describe('web_extract tool', () => {
  it('web_extract is registered', () => {
    const tool = TOOL_DEFINITIONS.find(t => t.name === 'web_extract');
    assert.ok(tool, 'web_extract tool should be registered');
    assert.ok(tool!.input_schema.properties.urls, 'should have urls param');
    assert.deepStrictEqual(tool!.input_schema.required, ['urls']);
  });

  it('web_extract returns error when TAVILY_API_KEY is missing', async () => {
    const original = process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_API_KEY;
    try {
      const result = await executeToolCall('web_extract', { urls: ['https://example.com'] }) as any;
      assert.ok(result.error || result.status === 'not_configured');
    } finally {
      if (original) process.env.TAVILY_API_KEY = original;
    }
  });
});

describe('verify_claim tool', () => {
  it('verify_claim is registered', () => {
    const tool = TOOL_DEFINITIONS.find(t => t.name === 'verify_claim');
    assert.ok(tool, 'verify_claim tool should be registered');
    assert.ok(tool!.input_schema.properties.claim, 'should have claim param');
    assert.ok(tool!.input_schema.properties.source, 'should have source param');
    assert.deepStrictEqual(tool!.input_schema.required, ['claim']);
  });

  it('verify_claim returns not_configured when TAVILY_API_KEY is missing', async () => {
    const original = process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_API_KEY;
    try {
      const result = await executeToolCall('verify_claim', { claim: 'test claim' }) as any;
      assert.ok(result.error || result.status === 'not_configured');
    } finally {
      if (original) process.env.TAVILY_API_KEY = original;
    }
  });
});
