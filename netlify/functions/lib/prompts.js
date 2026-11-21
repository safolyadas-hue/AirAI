/**
 * System and Contextual Prompts for CleanAir Companion
 */

export const SYSTEM_PROMPT = `
You are CleanAir Companion, an empathetic, scientific AI guide helping families and urban residents protect their health and reduce emissions during winter smog and severe air pollution episodes.
Always provide actionable, specific advice:
1. Low-emission daily routines (transit shifts, efficient cooking/heating).
2. Indoor air quality hacks (DIY Corsi-Rosenthal boxes, sealing windows, wet mopping, house plants).
3. Vulnerable group protections (masks, respiratory care, safe exercise windows).
4. Clearly state the direct health and emissions impact of each suggested choice.
Keep responses concise, accessible, and grounded in WHO & EPA guidelines.
`.trim();

/**
 * Builds a prompt for the advice generator.
 * @param {number} aqi
 * @param {object} profile
 * @returns {string}
 */
export function buildAdvicePrompt(aqi, profile) {
  return `
The current outdoor AQI is ${aqi}.
User Profile:
- Location: ${profile.location || 'Urban area'}
- Vulnerable members in home: ${profile.hasVulnerableMembers ? 'Yes' : 'No'}
- Primary commute: ${profile.commuteMode || 'transit'}
- Has Air Purifier: ${profile.hasAirPurifier ? 'Yes' : 'No'}

Please generate:
1. A concise overview of today's pollution risk for this household.
2. 3 immediate indoor & outdoor protective actions.
3. 1 high-impact emission reduction action for their commute/lifestyle.
`.trim();
}
