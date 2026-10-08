/**
 * Japan Seasons service integration.
 * Calls Japan Seasons MCP (keyless).
 * Returns [{id, kind, name, status, window, lat, lng, sourceUrl}]
 */

import { callMcpTool } from './mcp.js';
import { ENV } from './env.js';
import { sanitizeText, sanitizeHttpsUrl } from './sanitize.js';
import { memoryCache, TTL, normaliseKey } from './cache.js';

export async function fetchSeasonData(city = 'Tokyo', dateStr) {
  const cleanCity = sanitizeText(city, 50) || 'Tokyo';
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const month = isNaN(targetDate.getTime()) ? new Date().getMonth() + 1 : targetDate.getMonth() + 1;

  // Determine if trip is > 3 weeks away
  const now = new Date();
  const diffDays = Math.round((targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const isFarAhead = diffDays > 21;
  const timingLabel = isFarAhead ? 'typical timing, not a forecast' : 'active seasonal window';

  const cacheKey = normaliseKey('season', { city: cleanCity, month, isFarAhead });
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const results = [];
  const mcpUrl = ENV.JAPAN_SEASONS_MCP_URL;

  // 1. Fetch Festivals
  try {
    const festRaw = await callMcpTool({
      serverKey: 'SEASONS',
      url: mcpUrl,
      toolName: 'festivals_list',
      args: { query: cleanCity }
    });

    const festText = typeof festRaw === 'string' ? festRaw : (festRaw?.answer || festRaw?.text || '');
    if (festText) {
      // Parse markdown festival entries
      const entries = festText.split(/###\s+/);
      for (const entry of entries.slice(1, 10)) {
        const lines = entry.split('\n');
        const titleLine = lines[0] || '';
        const name = titleLine.replace(/\(.*?\)/, '').trim();
        const whenMatch = entry.match(/\*\*When:\*\*\s*([^\n]+)/i);
        const locMatch = entry.match(/\*\*Location:\*\*\s*([^\n]+)/i);
        const gpsMatch = entry.match(/\*\*(?:GPS|Lat\/Lng):\*\*\s*([0-9.-]+),\s*([0-9.-]+)/i);
        const officialMatch = entry.match(/\*\*(?:Official site|Official):\*\*\s*(https?:\/\/[^\s]+)/i);

        const locationStr = locMatch ? locMatch[1].toLowerCase() : '';
        const matchesCity = !cleanCity || locationStr.includes(cleanCity.toLowerCase()) || entry.toLowerCase().includes(cleanCity.toLowerCase());

        if (name && (matchesCity || results.length < 3)) {
          results.push({
            id: `fest-${sanitizeText(name).toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            kind: 'festival',
            name: sanitizeText(name, 100),
            status: timingLabel,
            window: whenMatch ? sanitizeText(whenMatch[1], 80) : `Month ${month}`,
            lat: gpsMatch ? parseFloat(gpsMatch[1]) : undefined,
            lng: gpsMatch ? parseFloat(gpsMatch[2]) : undefined,
            sourceUrl: sanitizeHttpsUrl(officialMatch ? officialMatch[1] : 'https://seasons.kooexperience.com')
          });
        }
      }
    }
  } catch (err) {
    // Non-blocking on festival failure
  }

  // 2. Fetch Flower Spots
  try {
    const flowerRaw = await callMcpTool({
      serverKey: 'SEASONS',
      url: mcpUrl,
      toolName: 'flowers_spots',
      args: {}
    });

    const flowerText = typeof flowerRaw === 'string' ? flowerRaw : (flowerRaw?.answer || flowerRaw?.text || '');
    if (flowerText) {
      const flowerEntries = flowerText.split(/###\s+/);
      for (const entry of flowerEntries.slice(1, 12)) {
        if (entry.toLowerCase().includes(cleanCity.toLowerCase()) || results.length < 5) {
          const lines = entry.split('\n');
          const name = lines[0].replace(/\(.*?\)/, '').trim();
          const peakMatch = entry.match(/\*\*Peak:\*\*\s*([^\n]+)/i);
          const gpsMatch = entry.match(/\*\*(?:GPS|Lat\/Lng):\*\*\s*([0-9.-]+),\s*([0-9.-]+)/i);
          const officialMatch = entry.match(/\*\*(?:Official site|Official):\*\*\s*(https?:\/\/[^\s]+)/i);

          if (name && !results.some(r => r.name === name)) {
            results.push({
              id: `flower-${sanitizeText(name).toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              kind: 'flower',
              name: sanitizeText(name, 100),
              status: timingLabel,
              window: peakMatch ? sanitizeText(peakMatch[1], 80) : `Season ${month}`,
              lat: gpsMatch ? parseFloat(gpsMatch[1]) : undefined,
              lng: gpsMatch ? parseFloat(gpsMatch[2]) : undefined,
              sourceUrl: sanitizeHttpsUrl(officialMatch ? officialMatch[1] : 'https://seasons.kooexperience.com')
            });
          }
        }
      }
    }
  } catch {
    // Non-blocking
  }

  // 3. Fruit picking highlights for the month
  try {
    const fruitRaw = await callMcpTool({
      serverKey: 'SEASONS',
      url: mcpUrl,
      toolName: 'fruit_seasons',
      args: { month }
    });

    const fruitText = typeof fruitRaw === 'string' ? fruitRaw : (fruitRaw?.answer || fruitRaw?.text || '');
    if (fruitText) {
      const fruitEntries = fruitText.split(/###\s+/);
      for (const entry of fruitEntries.slice(1, 5)) {
        const lines = entry.split('\n');
        const name = lines[0].replace(/[^a-zA-Z\s]/g, '').trim();
        const seasonMatch = entry.match(/\*\*Season:\*\*\s*([^\n]+)/i);

        if (name) {
          results.push({
            id: `fruit-${sanitizeText(name).toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            kind: 'fruit_picking',
            name: `${sanitizeText(name, 50)} Picking`,
            status: timingLabel,
            window: seasonMatch ? sanitizeText(seasonMatch[1], 60) : `Month ${month}`,
            sourceUrl: 'https://seasons.kooexperience.com'
          });
        }
      }
    }
  } catch {
    // Non-blocking
  }

  // Deduplicate and cap
  const finalItems = results.slice(0, 15);
  memoryCache.set(cacheKey, finalItems, TTL.SEASON);
  return finalItems;
}
