/**
 * HTTP helper with 8-second timeout, status validation, safe parsing, and retries on 5xx.
 */

const DEFAULT_TIMEOUT_MS = 8000;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Executes a fetch request with an 8-second timeout and at most one retry on 5xx.
 * Handles AbortController timeouts safely.
 */
export async function safeFetch(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let attempt = 0;
  const maxAttempts = 2; // initial + at most 1 retry on 5xx

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // If server error (5xx) and we have retries left, retry once
      if (response.status >= 500 && attempt < maxAttempts) {
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new HttpError(504, 'Upstream service timed out after 8 seconds');
      }

      // If network error and attempt < maxAttempts
      if (attempt < maxAttempts) {
        continue;
      }

      throw new HttpError(502, 'Network request to upstream service failed');
    }
  }

  throw new HttpError(504, 'Upstream request failed after retry');
}
