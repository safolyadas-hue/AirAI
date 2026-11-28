/**
 * User Profile and Household Preferences Domain Logic
 * Pure functions: zero DOM or network access.
 */

export const VALID_COMMUTE_MODES = Object.freeze([
  'walk',
  'cycle',
  'public_transit',
  'two_wheeler',
  'car',
  'work_from_home'
]);

export const VALID_HOME_TYPES = Object.freeze(['apartment', 'house']);

export const VALID_HEATING_MODES = Object.freeze([
  'electric',
  'gas',
  'wood_biomass',
  'coal',
  'none'
]);

export const VALID_COOKING_MODES = Object.freeze(['induction', 'electric', 'lpg', 'biomass']);
export const VALID_BUDGET_TIERS = Object.freeze(['low', 'medium', 'high']);

/**
 * @typedef {Object} Location
 * @property {string} name
 * @property {number} lat
 * @property {number} lon
 *
 * @typedef {Object} Household
 * @property {number} adults
 * @property {number} children
 * @property {number} elderly
 * @property {boolean} pregnant
 * @property {boolean} respiratoryCondition
 *
 * @typedef {Object} Commute
 * @property {'walk' | 'cycle' | 'public_transit' | 'two_wheeler' | 'car' | 'work_from_home'} mode
 * @property {number} distanceKm
 *
 * @typedef {Object} Home
 * @property {'apartment' | 'house'} type
 * @property {'electric' | 'gas' | 'wood_biomass' | 'coal' | 'none'} heating
 * @property {'induction' | 'electric' | 'lpg' | 'biomass'} cooking
 * @property {boolean} hasPurifier
 * @property {boolean} windowsSealed
 *
 * @typedef {Object} UserProfile
 * @property {Location} location
 * @property {Household} household
 * @property {Commute} commute
 * @property {Home} home
 * @property {'low' | 'medium' | 'high'} budget
 * @property {boolean} exerciseOutdoors
 * @property {string} [locationName]
 * @property {boolean} [hasVulnerableMembers]
 * @property {string} [commuteMode]
 * @property {boolean} [hasAirPurifier]
 */

/**
 * Creates a normalized default user profile.
 * @param {Partial<Record<string, any>>} [overrides={}]
 * @returns {UserProfile}
 */
export function createDefaultProfile(overrides = {}) {
  return validateProfile(overrides).value;
}

/**
 * Clamps numeric value safely within bounds.
 * @param {unknown} val
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
function clampNumber(val, min, max, fallback) {
  if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
  return Math.min(Math.max(val, min), max);
}

/**
 * Parses and validates location fields.
 * @param {Record<string, any>} src
 * @param {string[]} errors
 * @returns {Location}
 */
function parseLocation(src, errors) {
  const rawLoc = src.location && typeof src.location === 'object' ? src.location : {};
  const rawLocName =
    typeof src.location === 'string' ? src.location : rawLoc.name || src.locationName || '';
  if (
    rawLoc.lat !== undefined &&
    (typeof rawLoc.lat !== 'number' || rawLoc.lat < -90 || rawLoc.lat > 90)
  ) {
    errors.push('Location latitude must be between -90 and 90');
  }
  return {
    name: typeof rawLocName === 'string' && rawLocName.trim() ? rawLocName.trim() : 'Urban Area',
    lat: clampNumber(rawLoc.lat, -90, 90, 28.6139),
    lon: clampNumber(rawLoc.lon, -180, 180, 77.209)
  };
}

/**
 * Parses commute fields.
 * @param {Record<string, any>} src
 * @param {string[]} errors
 * @returns {Commute}
 */
function parseCommute(src, errors) {
  const rawCommute = src.commute && typeof src.commute === 'object' ? src.commute : {};
  let commuteMode = rawCommute.mode || src.commuteMode;
  if (commuteMode === 'transit') commuteMode = 'public_transit';
  if (commuteMode === 'bike') commuteMode = 'cycle';
  if (!VALID_COMMUTE_MODES.includes(commuteMode)) {
    if (commuteMode !== undefined) errors.push(`Invalid commute mode: ${commuteMode}`);
    commuteMode = 'public_transit';
  }
  return {
    mode: /** @type {Commute['mode']} */ (commuteMode),
    distanceKm: clampNumber(rawCommute.distanceKm, 0, 300, 10)
  };
}

/**
 * Parses home fields.
 * @param {Record<string, any>} src
 * @returns {Home}
 */
function parseHome(src) {
  const rawHome = src.home && typeof src.home === 'object' ? src.home : {};
  return {
    type: /** @type {Home['type']} */ (
      VALID_HOME_TYPES.includes(rawHome.type) ? rawHome.type : 'apartment'
    ),
    heating: /** @type {Home['heating']} */ (
      VALID_HEATING_MODES.includes(rawHome.heating) ? rawHome.heating : 'electric'
    ),
    cooking: /** @type {Home['cooking']} */ (
      VALID_COOKING_MODES.includes(rawHome.cooking) ? rawHome.cooking : 'induction'
    ),
    hasPurifier: Boolean(rawHome.hasPurifier || src.hasAirPurifier),
    windowsSealed: Boolean(rawHome.windowsSealed)
  };
}

/**
 * Validates and sanitizes a raw profile object without throwing.
 * @param {unknown} raw - Raw profile input.
 * @returns {{ valid: boolean, errors: string[], value: UserProfile }}
 */
export function validateProfile(raw) {
  const errors = [];
  const src = raw && typeof raw === 'object' ? /** @type {Record<string, any>} */ (raw) : {};
  if (!raw || typeof raw !== 'object') errors.push('Profile payload must be an object');

  const rawHh = src.household && typeof src.household === 'object' ? src.household : {};
  const household = {
    adults: Math.round(clampNumber(rawHh.adults, 1, 20, 1)),
    children: Math.round(clampNumber(rawHh.children, 0, 20, 0)),
    elderly: Math.round(clampNumber(rawHh.elderly, 0, 20, 0)),
    pregnant: Boolean(rawHh.pregnant),
    respiratoryCondition: Boolean(rawHh.respiratoryCondition || src.hasVulnerableMembers)
  };

  const budget = VALID_BUDGET_TIERS.includes(src.budget) ? src.budget : 'medium';
  if (src.budget !== undefined && !VALID_BUDGET_TIERS.includes(src.budget)) {
    errors.push(`Invalid budget tier: ${src.budget}`);
  }

  /** @type {UserProfile} */
  const value = {
    location: parseLocation(src, errors),
    household,
    commute: parseCommute(src, errors),
    home: parseHome(src),
    budget: /** @type {'low' | 'medium' | 'high'} */ (budget),
    exerciseOutdoors: Boolean(src.exerciseOutdoors),
    get locationName() {
      return this.location.name;
    },
    get hasVulnerableMembers() {
      return isVulnerableHousehold(this.household);
    },
    get commuteMode() {
      return this.commute.mode;
    },
    get hasAirPurifier() {
      return this.home.hasPurifier;
    }
  };

  return { valid: errors.length === 0, errors, value };
}

/**
 * Checks whether a household contains members vulnerable to air pollution.
 * @param {Household} household
 * @returns {boolean}
 */
export function isVulnerableHousehold(household) {
  if (!household || typeof household !== 'object') return false;
  return (
    household.children > 0 ||
    household.elderly > 0 ||
    Boolean(household.pregnant) ||
    Boolean(household.respiratoryCondition)
  );
}
