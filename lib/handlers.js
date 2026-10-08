/**
 * Consolidated HTTP handlers adhering to the standard Node (req, res) signature.
 * Used identically by Vercel standalone files in api/ and Express routes in server.ts.
 */

import { ENV, checkRequiredKey } from './env.js';
import { HttpError } from './http.js';
import { rateLimit } from './ratelimit.js';
import { sanitizeText, validateTripDates } from './sanitize.js';
import { fetchSeasonData } from './seasons.js';
import { fetchSafetyData } from './safety.js';
import { fetchHolidays } from './holidays.js';
import { fetchHiddenPlaces } from './places.js';
import { fetchDining } from './dining.js';
import { generateItinerary } from './itinerary.js';
import { sendFeedback } from './feedback.js';
import { checkHealth } from './health.js';

/**
 * 1. GET /api/season
 */
export async function handleSeason(req, res) {
  if (!rateLimit(req, res, { max: 60, windowMs: 60 * 1000, route: 'season' })) return;

  const city = sanitizeText(req.query?.city || 'Tokyo', 100);
  const date = req.query?.date ? sanitizeText(req.query.date, 30) : undefined;

  try {
    const data = await fetchSeasonData(city, date);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Seasonal information temporarily unavailable' });
  }
}

/**
 * 2. GET /api/safety
 */
export async function handleSafety(req, res) {
  if (!rateLimit(req, res, { max: 60, windowMs: 60 * 1000, route: 'safety' })) return;

  const city = req.query?.city ? sanitizeText(req.query.city, 100) : undefined;
  const lat = req.query?.lat;
  const lng = req.query?.lng;
  const startDate = req.query?.startDate ? sanitizeText(req.query.startDate, 30) : undefined;
  const endDate = req.query?.endDate ? sanitizeText(req.query.endDate, 30) : undefined;

  try {
    const data = await fetchSafetyData({ city, lat, lng, startDate, endDate });
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=900, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Safety and forecast data temporarily unavailable' });
  }
}

/**
 * 3. GET /api/holidays
 */
export async function handleHolidays(req, res) {
  if (!rateLimit(req, res, { max: 60, windowMs: 60 * 1000, route: 'holidays' })) return;

  if (!checkRequiredKey(res, 'SMITHERY_API_KEY', ENV.SMITHERY_API_KEY)) {
    return;
  }

  const startDate = req.query?.startDate;
  const endDate = req.query?.endDate;

  const validation = validateTripDates(startDate, endDate);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  try {
    const data = await fetchHolidays(startDate, endDate);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Holiday data temporarily unavailable' });
  }
}

/**
 * 4. GET /api/places
 */
export async function handlePlaces(req, res) {
  if (!rateLimit(req, res, { max: 20, windowMs: 60 * 1000, route: 'places' })) return;

  if (!checkRequiredKey(res, 'SMITHERY_API_KEY', ENV.SMITHERY_API_KEY)) return;
  if (!checkRequiredKey(res, 'BRAVE_API_KEY', ENV.BRAVE_API_KEY)) return;

  const city = sanitizeText(req.query?.city || 'Tokyo', 100);
  const interest = sanitizeText(req.query?.interest || 'culture', 100);
  const avoidCrowds = req.query?.avoidCrowds !== 'false';

  try {
    const data = await fetchHiddenPlaces(city, interest, avoidCrowds);
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Hidden gem search temporarily unavailable' });
  }
}

/**
 * 5. GET /api/dining
 */
export async function handleDining(req, res) {
  if (!rateLimit(req, res, { max: 40, windowMs: 60 * 1000, route: 'dining' })) return;

  if (!checkRequiredKey(res, 'RECRUIT_API_KEY', ENV.RECRUIT_API_KEY)) return;

  const city = req.query?.city ? sanitizeText(req.query.city, 100) : undefined;
  const lat = req.query?.lat;
  const lng = req.query?.lng;
  const genre = req.query?.genre ? sanitizeText(req.query.genre, 100) : undefined;

  try {
    const data = await fetchDining({ city, lat, lng, genre });
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Dining recommendations temporarily unavailable' });
  }
}

/**
 * 6. POST /api/itinerary
 */
export async function handleItinerary(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!rateLimit(req, res, { max: 15, windowMs: 60 * 1000, route: 'itinerary' })) return;

  if (!checkRequiredKey(res, 'GEMINI_API_KEY', ENV.GEMINI_API_KEY)) return;

  const body = req.body || {};
  const startDate = body.startDate;
  const endDate = body.endDate;

  const validation = validateTripDates(startDate, endDate);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const cities = Array.isArray(body.cities)
    ? body.cities.map(c => sanitizeText(c, 50)).filter(Boolean)
    : [sanitizeText(body.city || 'Tokyo', 50)];

  const travellerType = body.travellerType === 'family' ? 'family' : 'individual';
  const familyAges = body.familyAges ? sanitizeText(body.familyAges, 50) : '';
  const budgetBand = ['low', 'high'].includes(body.budgetBand) ? body.budgetBand : 'mid';
  const interests = Array.isArray(body.interests) ? body.interests.map(i => sanitizeText(i, 50)) : [];
  const avoidCrowds = body.avoidCrowds !== false;
  const pace = body.pace === 'packed' ? 'packed' : 'relaxed';
  const candidates = body.candidates || {};

  try {
    res.setHeader('Cache-Control', 'no-store');
    const itinerary = await generateItinerary({
      cities,
      startDate,
      endDate,
      travellerType,
      familyAges,
      budgetBand,
      interests,
      avoidCrowds,
      pace,
      candidates
    });
    res.status(200).json(itinerary);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Failed to assemble itinerary plan' });
  }
}

/**
 * 7. POST /api/feedback
 */
export async function handleFeedback(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!rateLimit(req, res, { max: 10, windowMs: 60 * 1000, route: 'feedback' })) return;

  if (!checkRequiredKey(res, 'TELEGRAM_BOT_TOKEN', ENV.TELEGRAM_BOT_TOKEN)) return;
  if (!checkRequiredKey(res, 'TELEGRAM_CHAT_ID', ENV.TELEGRAM_CHAT_ID)) return;

  const { message, contact, honeypot } = req.body || {};

  try {
    res.setHeader('Cache-Control', 'no-store');
    const result = await sendFeedback({ message, contact, honeypot });
    res.status(200).json(result);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Unable to submit feedback' });
  }
}

/**
 * 8. GET /api/health
 */
export async function handleHealth(req, res) {
  if (!rateLimit(req, res, { max: 120, windowMs: 60 * 1000, route: 'health' })) return;

  const isDeep = req.query?.deep === '1';

  try {
    res.setHeader('Cache-Control', 'no-store');
    const result = await checkHealth(isDeep);
    res.status(200).json(result);
  } catch (err) {
    res.status(502).json({ error: 'Health check failed' });
  }
}
