import { handleFeedback } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handleFeedback(req, res);
}
