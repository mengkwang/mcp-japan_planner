import { handleDining } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handleDining(req, res);
}
