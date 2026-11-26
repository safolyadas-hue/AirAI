/**
 * Netlify Function: CleanAir Assistant Chat Endpoint
 * Path: /api/chat
 *
 * Scoped strictly to air quality, health protection, and sustainable living.
 */
import { json, errorResponse, methodGuard, safeParseJson } from './lib/http.js';
import { validateChatPayload } from './lib/validate.js';
import { enforceRateLimit } from './lib/rateLimit.js';
import { callGemini, classifyGeminiError, GEMINI_CONFIG } from './lib/gemini.js';
import { cleanModelText } from './lib/sanitize.js';
import { CHAT_SYSTEM_PROMPT, buildChatUserPrompt } from './lib/prompts.js';

export const config = {
  path: '/api/chat'
};

const FALLBACK_CHAT_REPLY =
  'I am currently operating in offline mode. For immediate air protection, please seal drafty windows, run HEPA filtration indoors, and wear a certified N95 respirator if stepping outside during elevated AQI. Please consult a doctor for personal medical concerns.';

/**
 * Handles conversational air pollution inquiries.
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export default async function handler(req) {
  const methodBlock = methodGuard(req, ['POST']);
  if (methodBlock) return methodBlock;

  const rateBlock = enforceRateLimit(req, 'ai');
  if (rateBlock) return rateBlock;

  const bodyCheck = await safeParseJson(req);
  if (!bodyCheck.valid || !bodyCheck.data) {
    return errorResponse(bodyCheck.error || 'Invalid request body', 400);
  }

  const check = validateChatPayload(bodyCheck.data);
  if (!check.valid || !check.sanitized) {
    return errorResponse(check.error || 'Invalid chat parameters', 400);
  }

  const { message, history, context } = check.sanitized;
  const prompt = buildChatUserPrompt(message, context, history);

  try {
    const rawReply = await callGemini(prompt, CHAT_SYSTEM_PROMPT, {
      timeoutMs: GEMINI_CONFIG.CHAT_TIMEOUT_MS,
      maxOutputTokens: GEMINI_CONFIG.CHAT_MAX_OUTPUT_TOKENS
    });
    const reply = cleanModelText(rawReply);
    return json({ reply, fallback: false });
  } catch (err) {
    const geminiErr = classifyGeminiError(err);
    const statusPart = geminiErr.status ? ` (HTTP ${geminiErr.status})` : '';
    console.warn(`[chat] fallback: ${geminiErr.reason}${statusPart}`);

    const fallbackReason = geminiErr.status
      ? `${geminiErr.reason} (${geminiErr.status})`
      : geminiErr.reason;
    return json({ reply: cleanModelText(FALLBACK_CHAT_REPLY), fallback: true, fallbackReason });
  }
}
