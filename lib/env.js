/**
 * Environment configuration and validation helpers.
 */

export const ENV = {
  get SMITHERY_API_KEY() {
    return process.env.SMITHERY_API_KEY || '';
  },
  get BRAVE_API_KEY() {
    return process.env.BRAVE_API_KEY || '';
  },
  get RECRUIT_API_KEY() {
    return process.env.RECRUIT_API_KEY || '';
  },
  get GEMINI_API_KEY() {
    return process.env.GEMINI_API_KEY || '';
  },
  get GEMINI_MODEL() {
    return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  },
  get TELEGRAM_BOT_TOKEN() {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  },
  get TELEGRAM_CHAT_ID() {
    return process.env.TELEGRAM_CHAT_ID || '';
  },
  get JAPAN_SEASONS_MCP_URL() {
    return process.env.JAPAN_SEASONS_MCP_URL || 'https://seasons.kooexperience.com/mcp';
  },
  get CRIORA_MCP_URL() {
    return process.env.CRIORA_MCP_URL || 'https://criora.com/mcp';
  },
  get JAPAN_HOLIDAY_MCP_URL() {
    return process.env.JAPAN_HOLIDAY_MCP_URL || 'https://server.smithery.ai/kakar-satoshi/japan-holiday-mcp/mcp';
  },
  get BRAVE_MCP_URL() {
    return process.env.BRAVE_MCP_URL || 'https://server.smithery.ai/brave/mcp';
  },
  get APP_URL() {
    return process.env.APP_URL || '';
  }
};

/**
 * Checks if a required variable is present. If missing, responds 503 and returns false.
 */
export function checkRequiredKey(res, varName, value) {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    res.status(503).json({
      error: `${varName} is not set. Add it in Vercel and redeploy.`
    });
    return false;
  }
  return true;
}
