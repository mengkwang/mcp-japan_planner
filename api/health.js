import { handleHealth } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handleHealth(req, res);
}
