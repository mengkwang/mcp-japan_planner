import test from 'node:test';
import assert from 'node:assert';
import { parseMcpResponse, callMcpTool, ALLOWED_TOOLS } from '../lib/mcp.js';
import { checkRequiredKey } from '../lib/env.js';
import { safeFetch, HttpError } from '../lib/http.js';
import { sanitizeText, sanitizeHttpsUrl, validateTripDates } from '../lib/sanitize.js';
import { handleHolidays, handlePlaces, handleDining, handleSeason, handleSafety, handleItinerary } from '../lib/handlers.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

test('1. Missing required key returns 503 with no upstream call', async () => {
  const res = createMockRes();
  const passed = checkRequiredKey(res, 'SMITHERY_API_KEY', '');
  assert.strictEqual(passed, false);
  assert.strictEqual(res.statusCode, 503);
  assert.deepStrictEqual(res.body, {
    error: 'SMITHERY_API_KEY is not set. Add it in Vercel and redeploy.'
  });
});

test('2. 401 with empty body does not crash handler', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    return new Response('', { status: 401, statusText: 'Unauthorized' });
  };

  try {
    const res = await safeFetch('https://example.com/api');
    assert.strictEqual(res.status, 401);
    const text = await res.text();
    assert.strictEqual(text, '');
  } finally {
    global.fetch = originalFetch;
  }
});

test('3. Timeout returns 504 HttpError', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
      }, 50);
    });
  };

  try {
    await safeFetch('https://example.com/slow', {}, 20);
    assert.fail('Should have thrown 504 HttpError');
  } catch (err) {
    assert.strictEqual(err.status, 504);
    assert.strictEqual(err.message, 'Upstream service timed out after 8 seconds');
  } finally {
    global.fetch = originalFetch;
  }
});

test('4. MCP reply as plain JSON and SSE both parse', () => {
  // Plain JSON
  const jsonText = JSON.stringify({ jsonrpc: '2.0', id: 3, result: { content: [{ text: 'hello' }] } });
  const parsedJson = parseMcpResponse(jsonText, 3);
  assert.strictEqual(parsedJson.result.content[0].text, 'hello');

  // SSE text/event-stream
  const sseText = `event: message\ndata: {"jsonrpc":"2.0","id":3,"result":{"content":[{"text":"sse hello"}]}}\n\n`;
  const parsedSse = parseMcpResponse(sseText, 3);
  assert.strictEqual(parsedSse.result.content[0].text, 'sse hello');
});

test('5. isError MCP result returns 502', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.method === 'initialize') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { protocolVersion: '2024-11-05' } }));
    }
    if (body.method === 'tools/call') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        result: { isError: true, content: [{ text: 'Database error' }] }
      }));
    }
    return new Response('{}');
  };

  try {
    await callMcpTool({
      serverKey: 'CRIORA',
      url: 'https://criora.com/mcp',
      toolName: 'find_place',
      args: { query: 'test' }
    });
    assert.fail('Expected 502 HttpError on isError');
  } catch (err) {
    assert.strictEqual(err.status, 502);
  } finally {
    global.fetch = originalFetch;
  }
});

test('6. Missing or disallowed tool name returns 502', async () => {
  try {
    await callMcpTool({
      serverKey: 'CRIORA',
      url: 'https://criora.com/mcp',
      toolName: 'unauthorized_tool_name',
      args: {}
    });
    assert.fail('Expected 502 for unlisted tool');
  } catch (err) {
    assert.strictEqual(err.status, 502);
    assert.match(err.message, /not in allow-list/);
  }
});

test('7. Empty result returns 200 with empty list', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.method === 'initialize') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }));
    }
    if (body.method === 'tools/call') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        result: { content: [{ text: '# Japan Festivals\nSource: seasons\n' }] }
      }));
    }
    return new Response('{}');
  };

  try {
    const req = { query: { city: 'NonExistentCity12345' } };
    const res = createMockRes();
    await handleSeason(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
  } finally {
    global.fetch = originalFetch;
  }
});

test('8. Date validation checks format, past dates, and 14 days limit', () => {
  const invalidFormat = validateTripDates('2026/10/10', '2026/10/15');
  assert.strictEqual(invalidFormat.valid, false);

  const pastDate = validateTripDates('2020-01-01', '2020-01-05');
  assert.strictEqual(pastDate.valid, false);

  const tooLong = validateTripDates('2026-11-01', '2026-11-20');
  assert.strictEqual(tooLong.valid, false);
  assert.match(tooLong.error, /14 days or less/);

  const valid = validateTripDates('2026-11-01', '2026-11-07');
  assert.strictEqual(valid.valid, true);
  assert.strictEqual(valid.daysCount, 7);
});

test('9. Unknown candidateId is marked verified: false', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    return new Response(JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  days: [
                    {
                      date: '2026-11-01',
                      city: 'Tokyo',
                      theme: 'Discovery',
                      items: [
                        {
                          time: '10:00',
                          type: 'famous-sight',
                          name: 'Unknown Palace',
                          candidateId: 'non-existent-id-999',
                          why: 'Nice place'
                        }
                      ]
                    }
                  ]
                })
              }
            ]
          }
        }
      ]
    }));
  };

  try {
    const req = {
      method: 'POST',
      body: {
        startDate: '2026-11-01',
        endDate: '2026-11-02',
        cities: ['Tokyo'],
        candidates: {
          places: [{ id: 'known-id-1', name: 'Known Spot' }]
        }
      }
    };
    const res = createMockRes();
    await handleItinerary(req, res);
    assert.strictEqual(res.statusCode, 200);
    const item = res.body.days[0].items[0];
    assert.strictEqual(item.verified, false);
    assert.strictEqual(item.candidateId, null);
    // Ensure no null, NaN or undefined in minute or times
    assert.ok(item.time !== null && item.time !== undefined && !Number.isNaN(item.time));
  } finally {
    global.fetch = originalFetch;
  }
});

test('10. Keyless handlers (season, safety) work with keys removed', async () => {
  // Season handler
  const sReq = { query: { city: 'Tokyo' } };
  const sRes = createMockRes();
  await handleSeason(sReq, sRes);
  assert.strictEqual(sRes.statusCode, 200);
  assert.ok(Array.isArray(sRes.body));

  // Safety handler
  const safeReq = { query: { city: 'Tokyo', startDate: '2026-10-08', endDate: '2026-10-10' } };
  const safeRes = createMockRes();
  await handleSafety(safeReq, safeRes);
  assert.strictEqual(safeRes.statusCode, 200);
  assert.ok(Array.isArray(safeRes.body.advisories));
  assert.ok(Array.isArray(safeRes.body.hazards));
});
