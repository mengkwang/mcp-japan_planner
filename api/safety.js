import { handleSafety } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handleSafety(req, res);
}
