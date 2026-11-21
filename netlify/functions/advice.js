/**
 * Netlify Function: AI Clean Air Advice Generator
 * Path: /api/advice
 */
import { jsonResponse, errorResponse } from './lib/http.js';
import { parseJsonBody } from './lib/validate.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { callGemini } from './lib/gemini.js';
import { SYSTEM_PROMPT, buildAdvicePrompt } from './lib/prompts.js';

export const config = {
  path: '/api/advice'
};

/**
 * Generates tailored air pollution protective guidance via Gemini.
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const limit = checkRateLimit(clientIp);
  if (!limit.allowed) {
    return errorResponse('Too many requests. Please try again later.', 429);
  }

  const bodyCheck = await parseJsonBody(req);
  if (!bodyCheck.valid || !bodyCheck.data) {
    return errorResponse(bodyCheck.error || 'Invalid request body', 400);
  }

  const { aqi, profile } = bodyCheck.data;
  const prompt = buildAdvicePrompt(Number(aqi) || 150, profile || {});

  try {
    const aiText = await callGemini(prompt, SYSTEM_PROMPT);
    return jsonResponse({ advice: aiText });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown AI error';
    return errorResponse(`Failed to generate advice: ${errorMsg}`, 500);
  }
}
