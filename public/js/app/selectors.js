/**
 * Application View-Model Selectors
 * Pure functions transforming store state into ready-to-render UI view models.
 * Allowed to import domain/; UI modules must never import domain/ directly.
 */
import { getCategory } from '../domain/aqi.js';
import { estimateImpact } from '../domain/impact.js';
import { ACTION_IMPACT_FACTORS, COMMUNITY_MULTIPLIERS } from '../domain/impactFactors.js';
import { AQI_THEME_MAP } from '../config.js';

const PLAN_BLOCKS = ['morning', 'commute', 'midday', 'evening', 'night'];

/**
 * Maps an action + optional AI impactExplanations + domain estimateImpact into a UI action item.
 * @param {any} act
 * @param {any} profile
 * @param {any} advice
 * @param {string} adviceStatus
 * @returns {object}
 */
function mapAction(act, profile, advice, adviceStatus) {
  const key = act.impactKey || act.id;
  const hasFactor = Boolean(key && (key in ACTION_IMPACT_FACTORS || key === 'clean-commute-swap'));
  let impact = null;
  if (hasFactor) {
    const est = estimateImpact(key, profile);
    impact = {
      pm25ReductionRange: est.pm25ReductionPercentRange,
      co2KgPerWeek: est.co2AvoidedKgWeekly,
      confidence: est.confidence,
      assumption: est.assumption
    };
  }

  const aiExp =
    adviceStatus === 'ready' && Array.isArray(advice?.impactExplanations)
      ? advice.impactExplanations.find((e) => e.actionId === act.id)?.explanation || null
      : null;

  return {
    id: act.id,
    title: act.title,
    why: act.why,
    effort: act.effort,
    costTier: act.costTier,
    priority: act.priority,
    timeOfDay: act.timeOfDay,
    category: act.category,
    aiExplanation: aiExp,
    impact
  };
}

/**
 * Formats a concise household summary string from profile.
 * @param {any} profile
 * @returns {string}
 */
function formatHouseholdSummary(profile) {
  const hh = profile?.household;
  if (!hh) return 'your household';
  const parts = [];
  if (hh.adults > 0) parts.push(`${hh.adults} adult${hh.adults > 1 ? 's' : ''}`);
  if (hh.children > 0) parts.push(`${hh.children} child${hh.children > 1 ? 'ren' : ''}`);
  if (hh.elderly > 0) parts.push(`${hh.elderly} older adult${hh.elderly > 1 ? 's' : ''}`);
  if (hh.pregnant) parts.push('pregnancy care');
  if (hh.respiratoryCondition) parts.push('respiratory sensitivity');
  return parts.join(', ') || 'your household';
}

/**
 * Selects the view model for the Today view.
 * @param {any} state
 * @returns {object}
 */
export function selectTodayViewModel(state) {
  const snapshot = state.air?.airSnapshot || null;
  const aqi = snapshot?.aqi ?? 0;
  const cat = getCategory(aqi);
  const categoryKey = AQI_THEME_MAP[cat.id] || 'unhealthy';
  const adviceReady = state.adviceStatus === 'ready' && state.advice;
  const rules = state.rules || null;
  const firstHour = state.air?.hourly?.[0] || {};
  const riskLevel = rules?.riskLevel || 'low';

  const familyNarrative =
    adviceReady && state.advice.familyNarrative
      ? state.advice.familyNarrative
      : rules
        ? `${rules.headline} Tailored for ${formatHouseholdSummary(state.profile)} at US AQI ${Math.round(aqi)}.`
        : '';

  return {
    status: state.status,
    aqi,
    categoryKey,
    categoryLabel: cat.label,
    airSnapshot: snapshot,
    dominantPollutant: snapshot?.dominantPollutant?.pollutant || 'pm2_5',
    headline: (adviceReady && state.advice.summary) || rules?.headline || '',
    familyNarrative,
    stagnation: {
      risk: state.hourly?.stagnationRisk || 'low',
      windSpeed: firstHour.windSpeed ?? null,
      temperature: firstHour.temperature ?? null,
      humidity: firstHour.humidity ?? null
    },
    safetyBanner: {
      show: riskLevel === 'severe' || aqi >= 201,
      isSevere: riskLevel === 'severe' || aqi >= 301
    },
    topActions: (rules?.actions || [])
      .slice(0, 3)
      .map((a) => mapAction(a, state.profile, state.advice, state.adviceStatus)),
    allPlanActions: (rules?.actions || []).map((a) =>
      mapAction(a, state.profile, state.advice, state.adviceStatus)
    ),
    hourlyPoints: state.air?.hourly || [],
    hourlyAnalysis: state.hourly || null,
    adviceStatus: state.adviceStatus,
    lastUpdatedAt: state.lastUpdatedAt,
    locationName: state.profile?.location?.name || ''
  };
}

/**
 * Selects the view model for the My Plan view (5 daily blocks).
 * @param {any} state
 * @returns {object}
 */
export function selectPlanViewModel(state) {
  const adviceReady = state.adviceStatus === 'ready' && state.advice;
  const mapped = (state.rules?.actions || []).map((a) =>
    mapAction(a, state.profile, state.advice, state.adviceStatus)
  );

  const blocks = PLAN_BLOCKS.map((id) => ({
    id,
    aiNote: adviceReady && state.advice.dailyPlan?.[id] ? state.advice.dailyPlan[id] : null,
    actions: mapped.filter((a) =>
      a.timeOfDay === 'anytime' ? id === 'midday' : a.timeOfDay === id
    )
  }));

  return {
    blocks,
    totalActions: mapped.length,
    adviceStatus: state.adviceStatus
  };
}

/**
 * Selects the view model for the Indoor Air view.
 * @param {any} state
 * @returns {object}
 */
export function selectIndoorViewModel(state) {
  const aqi = state.air?.airSnapshot?.aqi ?? 0;
  const adviceReady = state.adviceStatus === 'ready' && state.advice;
  const indoorActions = (state.rules?.actions || [])
    .filter((a) => a.category === 'indoor' || a.category === 'mitigation')
    .map((a) => mapAction(a, state.profile, state.advice, state.adviceStatus));

  const bestWindow = state.hourly?.bestWindow || null;
  const hasSafeWindow = Boolean(bestWindow && bestWindow.aqi <= 100);

  return {
    groups: {
      free: indoorActions.filter((a) => a.costTier === 'free'),
      low: indoorActions.filter((a) => a.costTier === 'low'),
      invest: indoorActions.filter((a) => a.costTier === 'medium' || a.costTier === 'high')
    },
    diyProminent: Boolean(state.profile?.budget === 'low' || aqi > 100),
    ventilation: { hasSafeWindow, bestWindow, currentAqi: aqi },
    cookingHeating: {
      cooking: state.profile?.home?.cooking || 'induction',
      heating: state.profile?.home?.heating || 'electric'
    },
    aiIndoorTips:
      adviceReady && Array.isArray(state.advice.indoorTips) ? state.advice.indoorTips : [],
    adviceStatus: state.adviceStatus
  };
}

/**
 * Checks whether a swap action applies to the user's current profile.
 * @param {any} act
 * @param {any} profile
 * @returns {boolean}
 */
function isApplicableSwap(act, profile) {
  if (!profile) return true;
  if (act.id === 'cooking-emission-control') {
    return profile.home?.cooking === 'lpg' || profile.home?.cooking === 'biomass';
  }
  if (act.id === 'clean-commute-swap') {
    return profile.commute?.mode === 'car' || profile.commute?.mode === 'two_wheeler';
  }
  if (act.id === 'clean-heating-alternatives') {
    return profile.home?.heating === 'wood_biomass' || profile.home?.heating === 'coal';
  }
  return true;
}

/**
 * Selects the view model for the Greener Swaps view.
 * @param {any} state
 * @returns {object}
 */
export function selectSwapsViewModel(state) {
  const adviceReady = state.adviceStatus === 'ready' && state.advice;
  const swaps = (state.rules?.actions || [])
    .filter(
      (a) =>
        (a.category === 'swap' || a.category === 'mitigation') && isApplicableSwap(a, state.profile)
    )
    .map((a) => mapAction(a, state.profile, state.advice, state.adviceStatus));

  const n = COMMUNITY_MULTIPLIERS.HOUSEHOLD_COUNT;
  const communityActions = [
    {
      id: 'no-idling',
      communityEstimate: `If ${n} households pledge: ~${Math.round(n * COMMUNITY_MULTIPLIERS.NO_IDLING_KG_CO2_WEEK)} kg CO₂/week avoided`
    },
    {
      id: 'report-burning',
      communityEstimate: `If ${n} households report open burning: ~${COMMUNITY_MULTIPLIERS.REPORT_BURNING_LOCAL_PM25_PERCENT}% lower neighborhood PM2.5 spikes`
    },
    {
      id: 'tree-planting',
      communityEstimate: `If ${n} households plant 1 tree: ~${Math.round(n * COMMUNITY_MULTIPLIERS.TREE_PLANTING_KG_CO2_YEAR)} kg CO₂/year absorbed`
    },
    {
      id: 'carpooling',
      communityEstimate: `If ${n} households carpool: ~${Math.round(n * COMMUNITY_MULTIPLIERS.CARPOOL_KG_CO2_WEEK)} kg CO₂/week avoided`
    }
  ];

  return {
    groups: {
      commute: swaps.filter((s) => s.id === 'clean-commute-swap'),
      cooking: swaps.filter((s) => s.id === 'cooking-emission-control'),
      heating: swaps.filter((s) => s.id === 'clean-heating-alternatives')
    },
    communityActions,
    aiSwaps: adviceReady && Array.isArray(state.advice.swaps) ? state.advice.swaps : [],
    adviceStatus: state.adviceStatus
  };
}
