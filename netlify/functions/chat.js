/**
 * Netlify Function: CleanAir Assistant Chat Endpoint
 * Path: /api/chat
 */
import { jsonResponse, errorResponse } from './lib/http.js';
import { parseJsonBody } from './lib/validate.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { callGemini } from './lib/gemini.js';
import { SYSTEM_PROMPT } from './lib/prompts.js';

export const config = {
  path: '/api/chat'
};

/**
 * Handles interactive user chat inquiries.
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

  const { message, context } = bodyCheck.data;
  if (!message || typeof message !== 'string') {
    return errorResponse('Message string is required.', 400);
  }

  const promptWithContext = `
User Context:
${JSON.stringify(context || {})}

User Question:
${message}
`.trim();

  try {
    const reply = await callGemini(promptWithContext, SYSTEM_PROMPT);
    return jsonResponse({ reply });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown AI error';
    return errorResponse(`Failed to process message: ${errorMsg}`, 500);
  }
}
