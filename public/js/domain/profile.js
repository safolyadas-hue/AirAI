/**
 * User Profile and Household Preferences Domain Logic
 * Pure functions: zero DOM or network access.
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} location
 * @property {boolean} hasVulnerableMembers
 * @property {'car' | 'transit' | 'bike' | 'walk'} commuteMode
 * @property {boolean} hasAirPurifier
 */

/**
 * Creates a normalized user profile with safe defaults.
 * @param {Partial<UserProfile>} [initialProfile]
 * @returns {UserProfile}
 */
export function createDefaultProfile(initialProfile = {}) {
  return {
    location: (initialProfile.location || '').trim(),
    hasVulnerableMembers: Boolean(initialProfile.hasVulnerableMembers),
    commuteMode: initialProfile.commuteMode || 'transit',
    hasAirPurifier: Boolean(initialProfile.hasAirPurifier)
  };
}

/**
 * Validates a profile object.
 * @param {unknown} profile
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object') {
    return { valid: false, errors: ['Profile must be an object'] };
  }

  const p = /** @type {Record<string, unknown>} */ (profile);
  if (p.location && typeof p.location !== 'string') {
    errors.push('Location must be a string');
  }

  const validCommutes = ['car', 'transit', 'bike', 'walk'];
  if (p.commuteMode && !validCommutes.includes(/** @type {string} */ (p.commuteMode))) {
    errors.push('Invalid commute mode');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
