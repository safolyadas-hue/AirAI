/**
 * Netlify Function: AI Clean Air Advice Generator
 * Path: /api/advice
 *
 * Synthesizes personalized guidance with Gemini using JSON mode and fallback degradation.
 */
import { json, errorResponse, methodGuard, safeParseJson } from './lib/http.js';
import { validateProfilePayload } from './lib/validate.js';
import { enforceRateLimit } from './lib/rateLimit.js';
import { callGemini, classifyGeminiError, GeminiError } from './lib/gemini.js';
import { ADVICE_SYSTEM_PROMPT, buildAdviceUserPrompt } from './lib/prompts.js';

export const config = {
  path: '/api/advice'
};

const ADVICE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    familyNarrative: { type: 'STRING' },
    dailyPlan: {
      type: 'OBJECT',
      properties: {
        morning: { type: 'STRING' },
        commute: { type: 'STRING' },
        midday: { type: 'STRING' },
        evening: { type: 'STRING' },
        night: { type: 'STRING' }
      },
      required: ['morning', 'commute', 'midday', 'evening', 'night']
    },
    indoorTips: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    swaps: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    impactExplanations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          actionId: { type: 'STRING' },
          explanation: { type: 'STRING' }
        },
        required: ['actionId', 'explanation']
      }
    },
    motivation: { type: 'STRING' }
  },
  required: [
    'summary',
    'familyNarrative',
    'dailyPlan',
    'indoorTips',
    'swaps',
    'impactExplanations',
    'motivation'
  ]
};

/**
 * Creates deterministic fallback payload when AI generation fails.
 * @param {object} profile
 * @param {object} airSnapshot
 * @param {Array<object>} rulesOutput
 * @param {string} [fallbackReason='unknown']
 * @returns {object}
 */
function createFallbackAdvice(profile, airSnapshot, rulesOutput = [], fallbackReason = 'unknown') {
  const aqi = airSnapshot?.aqi ?? 150;
  return {
    fallback: true,
    fallbackReason,
    summary: `Current AQI is ${aqi}. Protective rules have been generated directly by our deterministic clean air engine.`,
    familyNarrative: `Tailored advisory for ${profile?.location?.name || 'your area'} based on WHO and EPA pollution guidelines.`,
    dailyPlan: {
      morning: 'Check morning AQI before opening doors; wet mop living zones.',
      commute: 'Wear an N95 respirator if traveling outdoors in heavy traffic.',
      midday: 'Keep windows sealed; operate HEPA filtration in primary rooms.',
      evening: 'Ensure kitchen ventilation is active during food preparation.',
      night: 'Keep bedroom air filtered and maintain comfortable humidity.'
    },
    indoorTips: [
      'Seal drafty door sills and window seams with damp towels or weatherstripping.',
      'Damp-mop hard surfaces instead of dry sweeping to capture settled particulate matter.',
      'Avoid indoor burning: extinguish scented candles and refrain from burning incense.'
    ],
    swaps: [
      'Switch vehicle commutes to closed public transit or metro during severe smog.',
      'Transition from unvented gas cooking to an electric induction plate.'
    ],
    impactExplanations: rulesOutput.map((act) => ({
      actionId: act.id,
      explanation: act.why || 'Reduces particulate inhalation and ambient emission burden.'
    })),
    motivation:
      'Every small clean air routine directly shields your family from long-term particulate exposure.'
  };
}

/**
 * Generates structured clean air advice via Gemini.
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

  const { profile: rawProfile, airSnapshot, rulesOutput = [] } = bodyCheck.data;
  const profileResult = validateProfilePayload(rawProfile);
  const profile = profileResult.value;

  const currentAqi = typeof airSnapshot?.aqi === 'number' ? airSnapshot.aqi : 150;
  const safeSnapshot = {
    ...airSnapshot,
    aqi: currentAqi
  };

  const prompt = buildAdviceUserPrompt(profile, safeSnapshot, rulesOutput);

  try {
    const rawAiResponse = await callGemini(prompt, ADVICE_SYSTEM_PROMPT, {
      jsonMode: true,
      responseSchema: ADVICE_RESPONSE_SCHEMA,
      requiredKeys: [
        'summary',
        'familyNarrative',
        'dailyPlan',
        'indoorTips',
        'swaps',
        'impactExplanations',
        'motivation'
      ],
      timeoutMs: 6500
    });

    const parsed = JSON.parse(rawAiResponse);
    if (!parsed || typeof parsed !== 'object' || !parsed.summary) {
      throw new GeminiError('schema_mismatch', 'AI output failed schema validation');
    }

    return json({ ...parsed, fallback: false });
  } catch (err) {
    const geminiErr = classifyGeminiError(err);
    const statusPart = geminiErr.status ? ` (HTTP ${geminiErr.status})` : '';
    console.warn(`[advice] fallback: ${geminiErr.reason}${statusPart}`);

    const fallbackReason = geminiErr.status
      ? `${geminiErr.reason} (${geminiErr.status})`
      : geminiErr.reason;
    const fallbackPayload = createFallbackAdvice(
      profile,
      safeSnapshot,
      rulesOutput,
      fallbackReason
    );
    return json(fallbackPayload, 200);
  }
}
