/**
 * Japan public holidays service integration.
 * Calls Smithery-hosted japan-holiday-mcp with SMITHERY_API_KEY.
 * Returns [{date, nameJa, nameEn?}]
 */

import { callMcpTool } from './mcp.js';
import { ENV } from './env.js';
import { sanitizeText } from './sanitize.js';
import { memoryCache, TTL, normaliseKey } from './cache.js';

export async function fetchHolidays(startDate, endDate) {
  const cacheKey = normaliseKey('holidays', { startDate, endDate });
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const raw = await callMcpTool({
    serverKey: 'HOLIDAYS',
    url: ENV.JAPAN_HOLIDAY_MCP_URL,
    toolName: 'get_holidays',
    args: {
      start_date: startDate,
      end_date: endDate
    },
    authHeader: `Bearer ${ENV.SMITHERY_API_KEY}`
  });

  let items = raw;
  if (typeof raw === 'string') {
    try { items = JSON.parse(raw); } catch { items = []; }
  } else if (raw && Array.isArray(raw.holidays)) {
    items = raw.holidays;
  }

  const results = [];
  if (Array.isArray(items)) {
    for (const item of items) {
      if (item.date && (item.nameJa || item.name || item.name_ja)) {
        results.push({
          date: String(item.date).slice(0, 10),
          nameJa: sanitizeText(item.nameJa || item.name_ja || item.name, 60),
          nameEn: item.nameEn || item.name_en ? sanitizeText(item.nameEn || item.name_en, 60) : undefined
        });
      }
    }
  }

  memoryCache.set(cacheKey, results, TTL.HOLIDAYS);
  return results;
}
