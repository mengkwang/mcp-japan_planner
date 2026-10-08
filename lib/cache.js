/**
 * In-memory TTL cache with normalised key support.
 */

class SimpleMemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

export const memoryCache = new SimpleMemoryCache();

export const TTL = {
  HAZARDS: 15 * 60 * 1000,           // 15 minutes
  FORECAST: 60 * 60 * 1000,          // 1 hour
  PLACES: 60 * 60 * 1000,            // 1 hour
  DINING: 60 * 60 * 1000,            // 1 hour
  TOOLS_LIST: 60 * 60 * 1000,        // 1 hour
  SEASON: 6 * 60 * 60 * 1000,        // 6 hours
  HOLIDAYS: 24 * 60 * 60 * 1000,     // 24 hours
  COORDINATES: 30 * 24 * 60 * 60 * 1000 // 30 days
};

export function normaliseKey(prefix, params = {}) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${String(params[k] ?? '').trim().toLowerCase()}`)
    .join('&');
  return `${prefix}:${sorted}`;
}
