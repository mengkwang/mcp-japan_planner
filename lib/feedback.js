/**
 * Feedback handler forwarding messages to Telegram Bot API.
 * Sanitizes input, enforces honeypot anti-spam check, and hides tokens.
 */

import { safeFetch, HttpError } from './http.js';
import { ENV, checkRequiredKey } from './env.js';
import { sanitizeText } from './sanitize.js';

export async function sendFeedback({ message, contact, honeypot }) {
  // Honeypot check for bots
  if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
    // Silently acknowledge bots without forwarding
    return { ok: true, status: 'acknowledged' };
  }

  const cleanMessage = sanitizeText(message, 1000);
  if (!cleanMessage || cleanMessage.length < 5) {
    throw new HttpError(400, 'Message must be between 5 and 1,000 characters');
  }

  const cleanContact = contact ? sanitizeText(contact, 100) : 'Anonymous';

  const botToken = ENV.TELEGRAM_BOT_TOKEN;
  const chatId = ENV.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new HttpError(503, 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set. Add it in Vercel and redeploy.');
  }

  const text = `🎌 *Komorebi Japan Planner Feedback*\n\n*Contact:* ${cleanContact}\n\n*Message:*\n${cleanMessage}`;

  try {
    // Token is in URL path, never log this URL or expose it in error messages
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await safeFetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });

    if (!res.ok) {
      throw new HttpError(502, 'Failed to forward feedback to notification service');
    }

    return { ok: true, message: 'Thanks, we read every message' };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, 'Failed to transmit feedback message');
  }
}
