/**
 * Serialized queue and coordinate resolution for Criora find_place.
 * Limits find_place calls to at most 1 per second across the instance,
 * and caches resolved coordinates for 30 days.
 */

import { memoryCache, TTL, normaliseKey } from './cache.js';

// Pre-seeded coordinates for popular Japanese destinations to minimize Criora queries
const KNOWN_JAPAN_CITIES = {
  tokyo: { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo' },
  kyoto: { latitude: 35.0116, longitude: 135.7681, name: 'Kyoto' },
  osaka: { latitude: 34.6937, longitude: 135.5023, name: 'Osaka' },
  sapporo: { latitude: 43.0618, longitude: 141.3545, name: 'Sapporo' },
  fukuoka: { latitude: 33.5904, longitude: 130.4017, name: 'Fukuoka' },
  hiroshima: { latitude: 34.3853, longitude: 132.4553, name: 'Hiroshima' },
  kanazawa: { latitude: 36.5613, longitude: 136.6562, name: 'Kanazawa' },
  nara: { latitude: 34.6851, longitude: 135.8048, name: 'Nara' },
  takayama: { latitude: 36.1461, longitude: 137.2522, name: 'Takayama' },
  hakone: { latitude: 35.2323, longitude: 139.1069, name: 'Hakone' },
  kobe: { latitude: 34.6901, longitude: 135.1955, name: 'Kobe' },
  nagoya: { latitude: 35.1815, longitude: 136.9066, name: 'Nagoya' },
  yokohama: { latitude: 35.4437, longitude: 139.6380, name: 'Yokohama' },
  sendai: { latitude: 38.2682, longitude: 140.8694, name: 'Sendai' },
  okinawa: { latitude: 26.2124, longitude: 127.6809, name: 'Okinawa' },
  naha: { latitude: 26.2124, longitude: 127.6809, name: 'Naha' },
  nikko: { latitude: 36.7550, longitude: 139.5986, name: 'Nikko' },
  kamakura: { latitude: 35.3192, longitude: 139.5467, name: 'Kamakura' }
};

// Seed into memoryCache
for (const [key, coords] of Object.entries(KNOWN_JAPAN_CITIES)) {
  const cacheKey = normaliseKey('coords', { city: key });
  memoryCache.set(cacheKey, coords, TTL.COORDINATES);
}

// Queue execution state
let lastExecutionTime = 0;
let queuePromise = Promise.resolve();

export async function resolveCoordinates(city, fetchFn) {
  if (!city || typeof city !== 'string') return null;
  const cleanCity = city.trim().toLowerCase();
  const cacheKey = normaliseKey('coords', { city: cleanCity });

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Enqueue through serialized chain with >= 1000ms delay between calls
  return new Promise((resolve, reject) => {
    queuePromise = queuePromise.then(async () => {
      try {
        const now = Date.now();
        const wait = Math.max(0, 1100 - (now - lastExecutionTime));
        if (wait > 0) {
          await new Promise(r => setTimeout(r, wait));
        }

        lastExecutionTime = Date.now();
        const result = await fetchFn(city);
        if (result && typeof result.latitude === 'number' && typeof result.longitude === 'number') {
          memoryCache.set(cacheKey, result, TTL.COORDINATES);
          resolve(result);
        } else {
          resolve(null);
        }
      } catch (err) {
        reject(err);
      }
    });
  });
}
