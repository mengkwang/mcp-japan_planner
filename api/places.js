import { handlePlaces } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handlePlaces(req, res);
}
