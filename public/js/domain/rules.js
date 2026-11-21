/**
 * Rule Engine for Contextual Air Quality Advisories
 * Pure functions: zero DOM or network access.
 */

/**
 * @typedef {Object} AdvisoryRule
 * @property {string} id
 * @property {string} category
 * @property {string} title
 * @property {string} description
 * @property {'low' | 'medium' | 'high' | 'critical'} severity
 */

/**
 * Evaluates contextual rules based on AQI and user profile.
 * @param {number} aqi - Air Quality Index.
 * @param {import('./profile.js').UserProfile} profile - User household profile.
 * @returns {AdvisoryRule[]} Array of applicable advisory rules.
 */
export function evaluateRules(aqi, profile) {
  const rules = [];

  if (aqi >= 200) {
    rules.push({
      id: 'severe-smog-mask',
      category: 'health',
      title: 'Wear N95/FFP2 Respirator',
      description:
        'Severe ambient particulate matter detected. Wear a well-fitted respirator outdoors.',
      severity: 'critical'
    });
  }

  if (aqi >= 150 && profile.hasVulnerableMembers) {
    rules.push({
      id: 'vulnerable-stay-indoors',
      category: 'health',
      title: 'Keep Sensitive Groups Indoors',
      description:
        'Air pollution is high. Vulnerable household members should avoid outdoor exertion.',
      severity: 'high'
    });
  }

  if (aqi > 100 && !profile.hasAirPurifier) {
    rules.push({
      id: 'indoor-air-hack',
      category: 'indoor',
      title: 'DIY Filter Hack & Wet Mopping',
      description:
        'Seal window gaps with draft stoppers and damp mop floors to reduce resuspended particles.',
      severity: 'medium'
    });
  }

  if (profile.commuteMode === 'car') {
    rules.push({
      id: 'commute-alternative',
      category: 'emissions',
      title: 'Carpool or Choose Electric Transit',
      description:
        'Switching 1 trip to electric transit prevents direct nitrogen dioxide & PM emissions in traffic.',
      severity: 'low'
    });
  }

  return rules;
}
