/**
 * Sanitization and validation helpers.
 */

/**
 * Strips HTML tags, script tags, and ASCII/Unicode control characters.
 */
export function sanitizeText(input, maxLength = 200) {
  if (typeof input !== 'string') return '';
  // Strip control characters (except common whitespace like space)
  let clean = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  // Strip HTML tags
  clean = clean.replace(/<[^>]*>/g, '');
  // Normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  // Truncate to maxLength
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength).trim();
  }
  return clean;
}

/**
 * Validates and normalizes an HTTPS URL. Returns null if not valid HTTPS.
 */
export function sanitizeHttpsUrl(urlStr) {
  if (typeof urlStr !== 'string' || !urlStr) return null;
  const trimmed = urlStr.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // invalid URL
  }
  return null;
}

/**
 * Validates ISO date string YYYY-MM-DD.
 */
export function isValidIsoDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

/**
 * Validates trip dates: not in the past, duration between 1 and 14 days.
 */
export function validateTripDates(startDateStr, endDateStr) {
  if (!isValidIsoDate(startDateStr) || !isValidIsoDate(endDateStr)) {
    return { valid: false, error: 'Dates must be valid ISO dates in YYYY-MM-DD format' };
  }

  const start = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T00:00:00Z');

  // Today in UTC
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (start < todayUtc) {
    return { valid: false, error: 'Start date cannot be in the past' };
  }

  if (end < start) {
    return { valid: false, error: 'End date must be on or after start date' };
  }

  const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (diffDays > 14) {
    return { valid: false, error: 'Trip duration must be 14 days or less' };
  }

  return { valid: true, daysCount: diffDays };
}

/**
 * Sanitizes candidate items to ensure no malicious injection reaches LLM.
 */
export function sanitizeCandidate(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    id: sanitizeText(item.id, 64),
    name: sanitizeText(item.name, 120),
    nameJa: item.nameJa ? sanitizeText(item.nameJa, 120) : undefined,
    genre: item.genre ? sanitizeText(item.genre, 60) : undefined,
    area: item.area ? sanitizeText(item.area, 60) : undefined,
    summary: item.summary ? sanitizeText(item.summary, 300) : undefined,
    kind: item.kind ? sanitizeText(item.kind, 50) : undefined,
    status: item.status ? sanitizeText(item.status, 100) : undefined,
    window: item.window ? sanitizeText(item.window, 100) : undefined,
    budgetLabel: item.budgetLabel ? sanitizeText(item.budgetLabel, 60) : undefined,
    access: item.access ? sanitizeText(item.access, 150) : undefined,
    hours: item.hours ? sanitizeText(item.hours, 150) : undefined,
    sourceUrl: sanitizeHttpsUrl(item.sourceUrl),
    sourceTitle: item.sourceTitle ? sanitizeText(item.sourceTitle, 150) : undefined,
    lat: typeof item.lat === 'number' && !isNaN(item.lat) ? item.lat : undefined,
    lng: typeof item.lng === 'number' && !isNaN(item.lng) ? item.lng : undefined
  };
}
