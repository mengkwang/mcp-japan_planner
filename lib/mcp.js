/**
 * Hand-written MCP client over Streamable HTTP using built-in fetch.
 * Implements handshake per request, tool allowlisting, SSE / JSON parsing,
 * structuredContent extraction, and 8s timeouts.
 */

import { safeFetch, HttpError } from './http.js';
import { memoryCache, TTL, normaliseKey } from './cache.js';

// Hard-coded verified tool allow-lists discovered from tools/list
export const ALLOWED_TOOLS = {
  SEASONS: [
    'japan_seasonal_answer',
    'sakura_now',
    'koyo_now',
    'sakura_forecast',
    'sakura_spots',
    'sakura_best_dates',
    'kawazu_forecast',
    'koyo_forecast',
    'koyo_spots',
    'koyo_best_dates',
    'weather_forecast',
    'flowers_spots',
    'fruit_seasons',
    'festivals_list',
    'fruit_farms',
    'search',
    'fetch'
  ],
  CRIORA: [
    'find_place',
    'get_forecast',
    'get_hazards_near',
    'assess_place',
    'get_climate_profile',
    'get_country_profile',
    'compare_countries'
  ],
  HOLIDAYS: [
    'get_holidays'
  ],
  BRAVE: [
    'brave_web_search'
  ]
};

/**
 * Parses response text that can be plain JSON or SSE (text/event-stream).
 */
export function parseMcpResponse(text, expectedId) {
  if (!text || typeof text !== 'string') {
    throw new HttpError(502, 'Empty response received from MCP server');
  }

  // Check if SSE format
  if (text.includes('data:')) {
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const payload = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(payload);
          if (expectedId === undefined || parsed.id === expectedId || parsed.result) {
            return parsed;
          }
        } catch {
          // continue checking lines
        }
      }
    }
  }

  // Otherwise, try parsing as plain JSON
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(502, 'MCP server returned invalid JSON or event stream');
  }
}

/**
 * Initializes and retrieves cached or live tools list for validation.
 */
export async function getLiveToolsList(url, authHeader, serverKey) {
  const cacheKey = normaliseKey('mcp_tools', { server: serverKey });
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // 1. Initialize
  const initRes = await safeFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'komorebi-mcp-client', version: '1.0.0' }
      }
    })
  });

  if (!initRes.ok) {
    throw new HttpError(initRes.status, `MCP initialize failed with status ${initRes.status}`);
  }

  const sessionId = initRes.headers.get('mcp-session-id');
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  // 2. notifications/initialized
  try {
    await safeFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      })
    });
  } catch {
    // Non-fatal if notifications not supported
  }

  // 3. tools/list
  const listRes = await safeFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    })
  });

  if (!listRes.ok) {
    throw new HttpError(listRes.status, `MCP tools/list failed with status ${listRes.status}`);
  }

  const listText = await listRes.text();
  const listJson = parseMcpResponse(listText, 2);
  const toolNames = (listJson?.result?.tools || []).map(t => t.name);

  memoryCache.set(cacheKey, toolNames, TTL.TOOLS_LIST);
  return toolNames;
}

/**
 * Calls an MCP tool following the per-request handshake protocol.
 */
export async function callMcpTool({
  serverKey,
  url,
  toolName,
  args = {},
  authHeader = null,
  extraHeaders = {}
}) {
  // Enforce allow-list
  const allowed = ALLOWED_TOOLS[serverKey];
  if (!allowed || !allowed.includes(toolName)) {
    throw new HttpError(502, `${serverKey} tool ${toolName} is not in allow-list`);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    ...extraHeaders
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // 1. Handshake initialize
  const initRes = await safeFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'komorebi-mcp-client', version: '1.0.0' }
      }
    })
  });

  if (!initRes.ok) {
    throw new HttpError(initRes.status, `MCP initialize failed with status ${initRes.status}`);
  }

  const sessionId = initRes.headers.get('mcp-session-id');
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  // 2. notifications/initialized
  try {
    await safeFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      })
    });
  } catch {
    // Non-fatal
  }

  // 3. tools/call
  const callRes = await safeFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    })
  });

  if (!callRes.ok) {
    throw new HttpError(callRes.status, `MCP tools/call failed with status ${callRes.status}`);
  }

  const callText = await callRes.text();
  const callJson = parseMcpResponse(callText, 3);

  if (!callJson || !callJson.result) {
    throw new HttpError(502, 'MCP server returned unexpected response format');
  }

  const result = callJson.result;
  if (result.isError) {
    throw new HttpError(502, `MCP tool execution reported error`);
  }

  // Extract structuredContent or parse content[0].text
  if (result.structuredContent) {
    return result.structuredContent;
  }

  if (Array.isArray(result.content) && result.content.length > 0) {
    const firstText = result.content[0]?.text;
    if (typeof firstText === 'string') {
      try {
        return JSON.parse(firstText);
      } catch {
        // Plain text capped at 2,000 characters
        return firstText.slice(0, 2000);
      }
    }
  }

  return null;
}
