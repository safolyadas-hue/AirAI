/**
 * Netlify Function: CleanAir Assistant Chat Endpoint
 * Path: /api/chat
 *
 * Scoped strictly to air quality, health protection, and sustainable living.
 */
import { json, errorResponse, methodGuard, safeParseJson } from './lib/http.js';
import { validateChatPayload } from './lib/validate.js';
import { enforceRateLimit } from './lib/rateLimit.js';
import { callGemini } from './lib/gemini.js';
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
    const reply = await callGemini(prompt, CHAT_SYSTEM_PROMPT, {
      timeoutMs: 6500
    });
    return json({ reply });
  } catch (_err) {
    return json({ reply: FALLBACK_CHAT_REPLY, fallback: true });
  }
}
