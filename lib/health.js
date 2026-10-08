/**
 * Health check handler.
 * Reports key configuration and optionally performs deep MCP probes with ?deep=1.
 * Never leaks keys, key fragments, or sensitive URLs.
 */

import { ENV } from './env.js';
import { getLiveToolsList } from './mcp.js';

export async function checkHealth(isDeep = false) {
  const status = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    services: {
      'japan-seasons-mcp': {
        type: 'mcp',
        keyConfigured: 'not required'
      },
      'criora': {
        type: 'mcp',
        keyConfigured: 'not required'
      },
      'japan-holiday-mcp': {
        type: 'mcp',
        keyConfigured: Boolean(ENV.SMITHERY_API_KEY)
      },
      'brave': {
        type: 'mcp',
        keyConfigured: Boolean(ENV.SMITHERY_API_KEY && ENV.BRAVE_API_KEY)
      },
      'recruit-hotpepper': {
        type: 'rest',
        keyConfigured: Boolean(ENV.RECRUIT_API_KEY)
      },
      'gemini': {
        type: 'llm',
        keyConfigured: Boolean(ENV.GEMINI_API_KEY)
      },
      'telegram': {
        type: 'webhook',
        keyConfigured: Boolean(ENV.TELEGRAM_BOT_TOKEN && ENV.TELEGRAM_CHAT_ID)
      }
    }
  };

  if (!isDeep) {
    return status;
  }

  // Deep probe for MCP servers
  // 1. Japan Seasons MCP
  try {
    const seasonsTools = await getLiveToolsList(ENV.JAPAN_SEASONS_MCP_URL, null, 'SEASONS');
    status.services['japan-seasons-mcp'].upstreamStatus = 'reachable';
    status.services['japan-seasons-mcp'].ok = true;
    status.services['japan-seasons-mcp'].toolCount = seasonsTools.length;
  } catch (err) {
    status.services['japan-seasons-mcp'].upstreamStatus = 'unavailable';
    status.services['japan-seasons-mcp'].ok = false;
    status.services['japan-seasons-mcp'].toolCount = 0;
  }

  // 2. Criora MCP
  try {
    const crioraTools = await getLiveToolsList(ENV.CRIORA_MCP_URL, null, 'CRIORA');
    status.services['criora'].upstreamStatus = 'reachable';
    status.services['criora'].ok = true;
    status.services['criora'].toolCount = crioraTools.length;
  } catch (err) {
    status.services['criora'].upstreamStatus = 'unavailable';
    status.services['criora'].ok = false;
    status.services['criora'].toolCount = 0;
  }

  // 3. Japan Holiday MCP (if key configured)
  if (ENV.SMITHERY_API_KEY) {
    try {
      const holidayTools = await getLiveToolsList(
        ENV.JAPAN_HOLIDAY_MCP_URL,
        `Bearer ${ENV.SMITHERY_API_KEY}`,
        'HOLIDAYS'
      );
      status.services['japan-holiday-mcp'].upstreamStatus = 'reachable';
      status.services['japan-holiday-mcp'].ok = true;
      status.services['japan-holiday-mcp'].toolCount = holidayTools.length;
    } catch {
      status.services['japan-holiday-mcp'].upstreamStatus = 'unavailable';
      status.services['japan-holiday-mcp'].ok = false;
      status.services['japan-holiday-mcp'].toolCount = 0;
    }
  } else {
    status.services['japan-holiday-mcp'].upstreamStatus = 'unconfigured';
    status.services['japan-holiday-mcp'].ok = false;
    status.services['japan-holiday-mcp'].toolCount = 0;
  }

  // 4. Brave Search MCP (if keys configured)
  if (ENV.SMITHERY_API_KEY && ENV.BRAVE_API_KEY) {
    try {
      const braveTools = await getLiveToolsList(
        ENV.BRAVE_MCP_URL,
        `Bearer ${ENV.SMITHERY_API_KEY}`,
        'BRAVE'
      );
      status.services['brave'].upstreamStatus = 'reachable';
      status.services['brave'].ok = true;
      status.services['brave'].toolCount = braveTools.length;
    } catch {
      status.services['brave'].upstreamStatus = 'unavailable';
      status.services['brave'].ok = false;
      status.services['brave'].toolCount = 0;
    }
  } else {
    status.services['brave'].upstreamStatus = 'unconfigured';
    status.services['brave'].ok = false;
    status.services['brave'].toolCount = 0;
  }

  return status;
}
