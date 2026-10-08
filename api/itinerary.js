import { handleItinerary } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handleItinerary(req, res);
}
