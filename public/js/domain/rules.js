/**
 * Deterministic Rules Engine for CleanAir Companion
 * Pure functions: evaluates user profile, air snapshot, and hourly forecasts to produce tailored advisories.
 */
import { isVulnerableHousehold, validateProfile } from './profile.js';
import { analyzeHourlyForecast } from './hourly.js';

/**
 * @typedef {Object} ActionRecommendation
 * @property {string} id
 * @property {'routine' | 'indoor' | 'mitigation' | 'swap' | 'protection'} category
 * @property {'morning' | 'commute' | 'midday' | 'evening' | 'night' | 'anytime'} timeOfDay
 * @property {string} title
 * @property {string} why
 * @property {'low' | 'medium' | 'high'} effort
 * @property {'free' | 'low' | 'medium' | 'high'} costTier
 * @property {number} priority - 1 (highest urgency) to 5
 * @property {string} impactKey
 */

/**
 * Computes household risk level based on AQI and vulnerability status.
 * @param {number} aqi
 * @param {boolean} isVulnerable
 * @returns {'low' | 'elevated' | 'high' | 'severe'}
 */
export function determineRiskLevel(aqi, isVulnerable) {
  if (aqi >= 301 || (aqi >= 201 && isVulnerable)) return 'severe';
  if (aqi >= 201 || (aqi >= 151 && isVulnerable)) return 'high';
  if (aqi >= 101 || (aqi >= 51 && isVulnerable)) return 'elevated';
  return 'low';
}

/**
 * Creates dynamic headline reflecting current risk and context.
 * @param {'low' | 'elevated' | 'high' | 'severe'} riskLevel
 * @param {number} aqi
 * @param {boolean} isVulnerable
 * @returns {string}
 */
export function createHeadline(riskLevel, aqi, isVulnerable) {
  if (riskLevel === 'severe') {
    return `Hazardous Pollution Alert (AQI ${aqi}): Seal Indoors & Avoid All Outdoor Exposure`;
  }
  if (riskLevel === 'high') {
    return isVulnerable
      ? 'High Smog Alert for Sensitive Household: Protect Breathing & Filter Indoor Air'
      : `Unhealthy Air Conditions (AQI ${aqi}): Limit Exertion and Use Protective Gear`;
  }
  if (riskLevel === 'elevated') {
    return isVulnerable
      ? 'Moderate Smog: Precautionary Measures Recommended for Sensitive Family Members'
      : `Air Quality Degrading (AQI ${aqi}): Optimize Routine Around Cleaner Windows`;
  }
  return `Clean Air Opportunity (AQI ${aqi}): Safe for Outdoor Activities and Ventilation`;
}

/**
 * Collects exercise and respiratory protection actions.
 * @param {import('./profile.js').UserProfile} profile
 * @param {number} aqi
 * @param {any} hourly
 * @param {boolean} vulnerable
 * @returns {ActionRecommendation[]}
 */
function collectProtectionActions(profile, aqi, hourly, vulnerable) {
  const actions = [];
  if (profile.exerciseOutdoors && aqi > 100) {
    const bestWin = hourly.bestWindow;
    const canShift = bestWin && bestWin.aqi <= 100;
    actions.push({
      id: 'shift-outdoor-exercise',
      category: 'routine',
      timeOfDay: canShift ? 'morning' : 'anytime',
      title: canShift
        ? `Shift Workout to Clean Window (${bestWin.time})`
        : 'Move Exercise Indoors with Air Cleaning',
      why: canShift
        ? `AQI is ${aqi}. Smog dips to ${bestWin.aqi} at ${bestWin.time}, cutting inhaled particle mass during exertion.`
        : `AQI of ${aqi} during vigorous breathing delivers high toxic particulate doses directly into deep lung tissue.`,
      effort: 'medium',
      costTier: 'free',
      priority: aqi > 150 ? 1 : 2,
      impactKey: 'shift-outdoor-exercise'
    });
  }
  if (aqi > 150 || (aqi > 100 && vulnerable)) {
    actions.push({
      id: 'n95-respirator-protection',
      category: 'protection',
      timeOfDay: 'commute',
      title: 'Wear a Certified N95/FFP2 Respirator Outdoors',
      why: 'Cloth and simple surgical masks do not filter microscopic PM2.5 aerosols. Only tight-fitting N95/FFP2 masks protect alveoli.',
      effort: 'low',
      costTier: 'low',
      priority: 1,
      impactKey: 'n95-respirator-protection'
    });
  }
  if (profile.household.children > 0 && aqi > 100) {
    actions.push({
      id: 'child-school-guidance',
      category: 'protection',
      timeOfDay: 'morning',
      title: 'Request Indoor Recess & PE at School',
      why: 'Children breathe faster per kg of body weight with developing airway tissue. High outdoor physical play during smog elevates asthma risks.',
      effort: 'low',
      costTier: 'free',
      priority: 2,
      impactKey: 'child-school-guidance'
    });
  }
  if (vulnerable && aqi > 100) {
    actions.push({
      id: 'vulnerable-household-care',
      category: 'protection',
      timeOfDay: 'anytime',
      title: 'Keep Respiratory Meds Accessible & Rest Indoors',
      why: 'Elevated particle concentrations trigger cardiovascular stress and bronchial hyperreactivity in elderly, pregnant, or asthmatic individuals.',
      effort: 'low',
      costTier: 'free',
      priority: 1,
      impactKey: 'vulnerable-household-care'
    });
  }
  return actions;
}

function collectCookingAndCommuteSwaps(profile, aqi, hourly) {
  const actions = [];
  if (profile.home.cooking === 'biomass' || profile.home.cooking === 'lpg') {
    actions.push({
      id: 'cooking-emission-control',
      category: 'swap',
      timeOfDay: 'evening',
      title: 'Ventilate Cooking & Consider Induction Cooktop',
      why: 'Gas and biomass stoves release high levels of indoor NO2, CO, and ultrafine particles. Run exhaust hoods or switch to electric induction.',
      effort: 'medium',
      costTier: profile.home.cooking === 'biomass' ? 'low' : 'medium',
      priority: profile.home.cooking === 'biomass' ? 2 : 3,
      impactKey: 'cooking-emission-control'
    });
  }
  if (
    (profile.commute.mode === 'car' || profile.commute.mode === 'two_wheeler') &&
    (aqi > 150 || hourly.stagnationRisk === 'high')
  ) {
    actions.push({
      id: 'clean-commute-swap',
      category: 'swap',
      timeOfDay: 'commute',
      title: 'Switch Car/Bike Commute to Metro or Transit',
      why: 'In-traffic pollutant levels are up to 3x higher than ambient monitors. Transit reduces personal exposure and cuts tailpipe emissions.',
      effort: 'medium',
      costTier: 'free',
      priority: 3,
      impactKey: 'clean-commute-swap'
    });
  }
  return actions;
}

/**
 * Collects indoor filtration, ventilation, and household emission swap actions.
 * @param {import('./profile.js').UserProfile} profile
 * @param {number} aqi
 * @param {any} hourly
 * @returns {ActionRecommendation[]}
 */
function collectIndoorAndSwapActions(profile, aqi, hourly) {
  const actions = [...collectCookingAndCommuteSwaps(profile, aqi, hourly)];
  if (aqi <= 50) {
    actions.push({
      id: 'ventilate-fresh-air',
      category: 'indoor',
      timeOfDay: 'midday',
      title: 'Open Windows for Cross-Ventilation',
      why: 'Outdoor air is currently clean. Flush accumulated indoor CO2, VOCs, and stale moisture.',
      effort: 'low',
      costTier: 'free',
      priority: 2,
      impactKey: 'smart-ventilation-air-cleaning'
    });
  } else {
    const purifierSolution = profile.home.hasPurifier
      ? 'Run your HEPA purifier in active rooms on medium/high speed.'
      : profile.budget === 'low'
        ? 'Build an inexpensive DIY Corsi-Rosenthal box using a standard box fan and MERV 13 filters.'
        : 'Deploy a True HEPA air purifier sized for your room volume.';
    actions.push({
      id: 'smart-ventilation-air-cleaning',
      category: 'indoor',
      timeOfDay: 'anytime',
      title: profile.home.hasPurifier
        ? 'Seal Window Gaps & Run HEPA Purifier'
        : 'Seal Windows & Deploy Air Filtration',
      why: `Outdoor AQI is ${aqi}. Weatherstrip leaky frames and drafty doors. ${purifierSolution}`,
      effort: profile.home.hasPurifier ? 'low' : 'medium',
      costTier: profile.home.hasPurifier ? 'free' : profile.budget === 'low' ? 'low' : 'medium',
      priority: 2,
      impactKey: 'smart-ventilation-air-cleaning'
    });
  }
  if (profile.home.heating === 'wood_biomass' || profile.home.heating === 'coal') {
    actions.push({
      id: 'clean-heating-alternatives',
      category: 'mitigation',
      timeOfDay: 'night',
      title: 'Halt Wood/Coal Heating; Use Electric or Warm Layering',
      why: 'Indoor solid fuel burning is the leading domestic source of toxic polycyclic aromatic hydrocarbons and heavy black carbon smog.',
      effort: 'medium',
      costTier: 'low',
      priority: 1,
      impactKey: 'clean-heating-alternatives'
    });
  }
  if (aqi > 100) {
    actions.push(
      {
        id: 'eliminate-indoor-combustion',
        category: 'indoor',
        timeOfDay: 'evening',
        title: 'Eliminate Incense, Candles, and Aerosol Sprays',
        why: 'Burning incense and scented candles releases high concentrations of ultrafine PM and volatile organic compounds directly into sealed indoor air.',
        effort: 'low',
        costTier: 'free',
        priority: 4,
        impactKey: 'eliminate-indoor-combustion'
      },
      {
        id: 'wet-mopping-hydration',
        category: 'routine',
        timeOfDay: 'morning',
        title: 'Wet-Mop Floors & Maintain Respiratory Hydration',
        why: 'Dry sweeping resuspends settled toxic particulates into the air. Damp microfiber mopping traps dust, and hydration keeps mucosal barriers resilient.',
        effort: 'low',
        costTier: 'free',
        priority: 4,
        impactKey: 'wet-mopping-hydration'
      }
    );
  }
  return actions;
}

/**
 * Deterministic rules evaluation.
 * @param {any} profileInput - User profile.
 * @param {any} airSnapshot - Current air snapshot or numeric AQI.
 * @param {any} [hourlyForecastInput] - Hourly forecast analysis or array.
 * @returns {{ riskLevel: 'low' | 'elevated' | 'high' | 'severe', vulnerableHousehold: boolean, headline: string, actions: ActionRecommendation[] }}
 */
export function evaluateRules(profileInput, airSnapshot, hourlyForecastInput) {
  let rawProfile = profileInput;
  let aqi = 120;
  if (typeof profileInput === 'number') {
    aqi = profileInput;
    rawProfile = airSnapshot || {};
  } else if (typeof airSnapshot === 'number') {
    aqi = airSnapshot;
  } else if (airSnapshot && typeof airSnapshot.aqi === 'number') {
    aqi = airSnapshot.aqi;
  }

  const { value: profile } = validateProfile(rawProfile);
  const vulnerable = isVulnerableHousehold(profile.household);
  const hourly =
    hourlyForecastInput && hourlyForecastInput.bestWindow !== undefined
      ? hourlyForecastInput
      : analyzeHourlyForecast(hourlyForecastInput || []);

  const riskLevel = determineRiskLevel(aqi, vulnerable);
  const actions = [
    ...collectProtectionActions(profile, aqi, hourly, vulnerable),
    ...collectIndoorAndSwapActions(profile, aqi, hourly)
  ].sort((a, b) => a.priority - b.priority);

  return {
    riskLevel,
    vulnerableHousehold: vulnerable,
    headline: createHeadline(riskLevel, aqi, vulnerable),
    actions: actions.slice(0, 6)
  };
}
