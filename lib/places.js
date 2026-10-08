/**
 * Hidden-gem places integration using Brave Search MCP.
 * Calls brave_web_search with English and Japanese (穴場) query variants.
 * Returns [{id, name, summary, sourceUrl, sourceTitle}]
 */

import { callMcpTool } from './mcp.js';
import { ENV } from './env.js';
import { sanitizeText, sanitizeHttpsUrl } from './sanitize.js';
import { memoryCache, TTL, normaliseKey } from './cache.js';

export async function fetchHiddenPlaces(city = 'Tokyo', interest = 'culture', avoidCrowds = true) {
  const cleanCity = sanitizeText(city, 50) || 'Tokyo';
  const cleanInterest = sanitizeText(interest, 50) || 'hidden gems';

  const cacheKey = normaliseKey('places', { city: cleanCity, interest: cleanInterest, avoidCrowds });
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // English query variant
  const enQuery = avoidCrowds
    ? `${cleanCity} Japan quiet hidden gems off beaten path ${cleanInterest} travel`
    : `${cleanCity} Japan top highlights ${cleanInterest}`;

  // Japanese query variant using 穴場 (hidden spot)
  const jaQuery = `${cleanCity} ${cleanInterest} 穴場 スポット 観光`;

  const results = [];
  const seenUrls = new Set();

  const queries = [enQuery, jaQuery];

  for (const query of queries) {
    try {
      const raw = await callMcpTool({
        serverKey: 'BRAVE',
        url: ENV.BRAVE_MCP_URL,
        toolName: 'brave_web_search',
        args: { query, count: 5 },
        authHeader: `Bearer ${ENV.SMITHERY_API_KEY}`,
        extraHeaders: {
          'X-Brave-Token': ENV.BRAVE_API_KEY,
          'X-Subscription-Token': ENV.BRAVE_API_KEY
        }
      });

      let items = [];
      if (raw && typeof raw === 'object') {
        if (Array.isArray(raw.web?.results)) {
          items = raw.web.results;
        } else if (Array.isArray(raw.results)) {
          items = raw.results;
        } else if (Array.isArray(raw.mixed?.main)) {
          items = raw.mixed.main;
        }
      } else if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          items = parsed.web?.results || parsed.results || [];
        } catch {
          // non-json
        }
      }

      for (const item of items) {
        const url = sanitizeHttpsUrl(item.url);
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        const title = sanitizeText(item.title || '', 100);
        const snippet = sanitizeText(item.description || item.snippet || '', 250);

        // Name extracted from title (cleaned of common site suffixes)
        const nameClean = title.split(/[-–|:•]/)[0].trim();
        if (!nameClean) continue;

        // At most 2 sentences in our own words
        const sentences = snippet.split(/(?<=[.!?])\s+/).filter(Boolean);
        const summary = sentences.slice(0, 2).join(' ') || `A curated destination for ${cleanInterest} in ${cleanCity}.`;

        results.push({
          id: `place-${results.length + 1}-${nameClean.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`,
          name: sanitizeText(nameClean, 80),
          summary: sanitizeText(summary, 200),
          sourceUrl: url,
          sourceTitle: sanitizeText(title, 120)
        });

        if (results.length >= 10) break;
      }
    } catch (err) {
      // Continue to next query if one fails
    }
  }

  memoryCache.set(cacheKey, results, TTL.PLACES);
  return results;
}
