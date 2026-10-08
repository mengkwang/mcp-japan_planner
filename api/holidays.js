import { handleHolidays } from '../lib/handlers.js';

export default async function handler(req, res) {
  return handleHolidays(req, res);
}
