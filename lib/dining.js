/**
 * Recruit Hot Pepper Gourmet REST API integration.
 * Fetches authentic Japan dining options.
 * Returns [{id, name, genre, area, budgetLabel, access, hours, lat, lng, sourceUrl}]
 * Retains original Japanese restaurant names without translating.
 */

import { safeFetch, HttpError } from './http.js';
import { ENV } from './env.js';
import { sanitizeText, sanitizeHttpsUrl } from './sanitize.js';
import { memoryCache, TTL, normaliseKey } from './cache.js';

export async function fetchDining({ city, lat, lng, genre }) {
  const cacheKey = normaliseKey('dining', { city, lat, lng, genre });
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const endpoint = new URL('https://webservice.recruit.co.jp/hotpepper/gourmet/v1/');
  endpoint.searchParams.set('key', ENV.RECRUIT_API_KEY);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('count', '15');

  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    endpoint.searchParams.set('lat', String(lat));
    endpoint.searchParams.set('lng', String(lng));
    endpoint.searchParams.set('range', '3'); // ~1000m
  } else if (city) {
    endpoint.searchParams.set('keyword', city);
  } else {
    endpoint.searchParams.set('keyword', 'Tokyo');
  }

  if (genre) {
    endpoint.searchParams.set('keyword', `${endpoint.searchParams.get('keyword') || ''} ${genre}`.trim());
  }

  const response = await safeFetch(endpoint.toString());

  if (!response.ok) {
    throw new HttpError(response.status, `Hot Pepper Gourmet API returned status ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new HttpError(502, 'Failed to parse Hot Pepper Gourmet response');
  }

  const shops = data?.results?.shop || [];
  const results = [];

  for (const shop of shops) {
    if (!shop.id || !shop.name) continue;

    results.push({
      id: sanitizeText(shop.id, 64),
      name: sanitizeText(shop.name, 100), // Original Japanese name, un-translated
      genre: shop.genre?.name ? sanitizeText(shop.genre.name, 60) : undefined,
      area: shop.middle_area?.name || shop.small_area?.name ? sanitizeText(shop.middle_area?.name || shop.small_area?.name, 60) : undefined,
      budgetLabel: shop.budget?.average || shop.budget?.name ? sanitizeText(shop.budget?.average || shop.budget?.name, 60) : undefined,
      access: shop.access ? sanitizeText(shop.access, 150) : undefined,
      hours: shop.open ? sanitizeText(shop.open, 150) : undefined,
      lat: typeof shop.lat === 'number' ? shop.lat : (shop.lat ? parseFloat(shop.lat) : undefined),
      lng: typeof shop.lng === 'number' ? shop.lng : (shop.lng ? parseFloat(shop.lng) : undefined),
      sourceUrl: sanitizeHttpsUrl(shop.urls?.pc) || 'https://www.hotpepper.jp/'
    });
  }

  memoryCache.set(cacheKey, results, TTL.DINING);
  return results;
}
