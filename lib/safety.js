/**
 * Criora safety & forecast integration.
 * Resolves coordinates, fetches 7-day weather risk and nearby hazards.
 * Returns { forecastByDay[], hazards[], advisories[] }
 */

import { callMcpTool } from './mcp.js';
import { ENV } from './env.js';
import { resolveCoordinates } from './queue.js';
import { sanitizeText } from './sanitize.js';
import { memoryCache, TTL, normaliseKey } from './cache.js';

export async function fetchSafetyData({ city, lat, lng, startDate, endDate }) {
  let latitude = typeof lat === 'number' && !isNaN(lat) ? lat : (lat ? parseFloat(lat) : null);
  let longitude = typeof lng === 'number' && !isNaN(lng) ? lng : (lng ? parseFloat(lng) : null);

  const mcpUrl = ENV.CRIORA_MCP_URL;

  // Resolve coordinates if missing
  if ((latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) && city) {
    const coords = await resolveCoordinates(city, async (q) => {
      const res = await callMcpTool({
        serverKey: 'CRIORA',
        url: mcpUrl,
        toolName: 'find_place',
        args: { query: `${q}, Japan` }
      });

      let items = res;
      if (typeof res === 'string') {
        try { items = JSON.parse(res); } catch { items = []; }
      } else if (res && res.result) {
        items = res.result;
      }

      if (Array.isArray(items) && items.length > 0) {
        return {
          latitude: parseFloat(items[0].latitude),
          longitude: parseFloat(items[0].longitude),
          name: items[0].name || q
        };
      }
      return null;
    });

    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    }
  }

  // Fallback to Tokyo coordinates if still unresolved
  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    latitude = 35.6762;
    longitude = 139.6503;
  }

  const advisories = ['Check official government travel advisories before you go.'];
  let forecastByDay = [];
  let hazards = [];

  // Check date range relative to today
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const tripStart = startDate ? new Date(startDate + 'T00:00:00Z') : now;

  // Check if trip start is beyond 7 days from now
  const isBeyondForecastWindow = tripStart > sevenDaysFromNow;

  if (isBeyondForecastWindow) {
    advisories.push('Forecast not available yet for these dates (forecast window covers up to 7 days ahead).');
  } else {
    // 1. Fetch 7-day forecast
    const forecastCacheKey = normaliseKey('criora_forecast', { lat: latitude.toFixed(3), lng: longitude.toFixed(3) });
    const cachedForecast = memoryCache.get(forecastCacheKey);

    if (cachedForecast) {
      forecastByDay = cachedForecast;
    } else {
      try {
        const rawForecast = await callMcpTool({
          serverKey: 'CRIORA',
          url: mcpUrl,
          toolName: 'get_forecast',
          args: { latitude, longitude }
        });

        let fData = rawForecast;
        if (typeof rawForecast === 'string') {
          try { fData = JSON.parse(rawForecast); } catch { fData = null; }
        }

        if (fData && Array.isArray(fData.days)) {
          forecastByDay = fData.days.map(d => ({
            date: d.date,
            tempMin: typeof d.temperature_min === 'number' ? Math.round(d.temperature_min) : undefined,
            tempMax: typeof d.temperature_max === 'number' ? Math.round(d.temperature_max) : undefined,
            precipMm: typeof d.precipitation_rate_max === 'number' ? d.precipitation_rate_max : 0,
            windSpeed: typeof d.wind_speed_max === 'number' ? d.wind_speed_max : undefined,
            riskLevel: d.risk?.level || 'Low',
            hazard: d.risk?.hazard || null
          }));
          memoryCache.set(forecastCacheKey, forecastByDay, TTL.FORECAST);
        }
      } catch (err) {
        advisories.push('7-day weather forecast temporarily unavailable.');
      }
    }
  }

  // 2. Fetch hazards near coordinates
  const hazardsCacheKey = normaliseKey('criora_hazards', { lat: latitude.toFixed(3), lng: longitude.toFixed(3) });
  const cachedHazards = memoryCache.get(hazardsCacheKey);

  if (cachedHazards) {
    hazards = cachedHazards;
  } else {
    try {
      const rawHazards = await callMcpTool({
        serverKey: 'CRIORA',
        url: mcpUrl,
        toolName: 'get_hazards_near',
        args: { latitude, longitude, radius_km: 150 }
      });

      let hData = rawHazards;
      if (typeof rawHazards === 'string') {
        try { hData = JSON.parse(rawHazards); } catch { hData = null; }
      }

      if (hData && Array.isArray(hData.data)) {
        hazards = hData.data.slice(0, 5).map(h => ({
          id: String(h.id || Math.random()),
          type: sanitizeText(h.type || 'hazard', 40),
          label: sanitizeText(h.label || h.sublabel || 'Reported regional event', 100),
          severity: sanitizeText(h.severity || 'low', 30),
          valueText: sanitizeText(h.value_text || '', 30),
          eventDate: sanitizeText(h.event_date || '', 30),
          timeAgo: sanitizeText(h.time_ago || '', 30),
          source: sanitizeText(h.source || 'GDACS', 30),
          note: 'Reported monitoring event; never implies hazard certainty.'
        }));
        memoryCache.set(hazardsCacheKey, hazards, TTL.HAZARDS);
      }
    } catch (err) {
      // Non-blocking
    }
  }

  return {
    forecastByDay,
    hazards,
    advisories
  };
}
