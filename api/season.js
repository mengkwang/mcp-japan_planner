import { handleSeason } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handleSeason(req, res);
}
