/**
 * Application View-Model Selectors - Chat & Impact What-If
 */
import { summarizeImpact } from '../domain/impact.js';
import {
  COMMUNITY_MULTIPLIERS,
  INDOOR_OUTDOOR_RATIO,
  WHO_PM25_24H_GUIDELINE_UGM3
} from '../domain/impactFactors.js';
import i18n from '../i18n/en.js';

const CHAT_MAX_CHARS = 500;

/**
 * Selects the view model for the Ask Assistant chat view.
 * @param {any} state
 * @returns {object}
 */
export function selectChatViewModel(state) {
  const profile = state.profile;
  const starters = [];
  const s = i18n.chat.starters;

  if (profile?.household?.children > 0) starters.push(s.kidsOutside);
  if (profile?.budget === 'low') starters.push(s.cheapestClean);
  if (profile?.home?.hasPurifier) starters.push(s.purifierOvernight);
  if (profile?.home?.heating === 'wood_biomass' || profile?.home?.heating === 'coal') {
    starters.push(s.woodAlternative);
  }
  starters.push(s.genericMask);
  if (starters.length < 3) starters.push(s.genericVentilation);

  return {
    messages: state.chat?.messages || [],
    status: state.chat?.status || 'idle',
    error: state.chat?.error || null,
    starterPrompts: starters.slice(0, 4),
    maxChars: CHAT_MAX_CHARS,
    showSafetyNote: true
  };
}

function mapActionArea(act) {
  if (act.category === 'swap' || act.id === 'clean-commute-swap') return 'commute';
  if (act.category === 'indoor' || act.category === 'mitigation') return 'home';
  return 'protection';
}

function buildChartData(outdoorPm25, summary) {
  const baselineLow = Math.round(outdoorPm25 * INDOOR_OUTDOOR_RATIO.low * 10) / 10;
  const baselineHigh = Math.round(outdoorPm25 * INDOOR_OUTDOOR_RATIO.high * 10) / 10;
  const baselineMid = Math.round(((baselineLow + baselineHigh) / 2) * 10) / 10;
  const minRed = summary.estimatedIndoorPm25ReductionPercent.min / 100;
  const maxRed = summary.estimatedIndoorPm25ReductionPercent.max / 100;
  const withActionsLow = Math.round(baselineLow * (1 - maxRed) * 10) / 10;
  const withActionsHigh = Math.round(baselineHigh * (1 - minRed) * 10) / 10;
  const withActionsMid = Math.round(((withActionsLow + withActionsHigh) / 2) * 10) / 10;

  return {
    outdoorPm25,
    baselineLow,
    baselineHigh,
    baselineMid,
    withActionsLow,
    withActionsHigh,
    withActionsMid,
    whoGuideline: WHO_PM25_24H_GUIDELINE_UGM3
  };
}

/**
 * Selects the view model for the Impact what-if dashboard.
 * @param {any} state
 * @param {string[] | null} [selectedIds=null]
 * @param {(act: any, profile: any, advice: any, status: string) => any} mapActionFn
 * @returns {object}
 */
export function selectImpactViewModel(state, selectedIds = null, mapActionFn) {
  const snapshot = state.air?.airSnapshot || null;
  const rawActions = state.rules?.actions || [];
  if (!snapshot || rawActions.length === 0) {
    return { hasData: false, availableActions: [], selectedIds: [] };
  }

  const availableActions = rawActions
    .map((a) => ({
      ...mapActionFn(a, state.profile, state.advice, state.adviceStatus),
      area: mapActionArea(a)
    }))
    .filter((a) => a.impact !== null);

  if (availableActions.length === 0) {
    return { hasData: false, availableActions: [], selectedIds: [] };
  }

  const activeIds = Array.isArray(selectedIds)
    ? selectedIds.filter((id) => availableActions.some((a) => a.id === id))
    : availableActions.slice(0, 5).map((a) => a.id);

  const selectedActions = availableActions.filter((a) => activeIds.includes(a.id));
  const summary = summarizeImpact(selectedActions, state.profile);
  const outdoorPm25 = typeof snapshot.pm2_5 === 'number' ? snapshot.pm2_5 : 0;
  const n = COMMUNITY_MULTIPLIERS.HOUSEHOLD_COUNT;

  const assumptions = [
    ...selectedActions.map((a) => `${a.title}: ${a.impact.assumption}`),
    `Indoor/outdoor ratio (${Math.round(INDOOR_OUTDOOR_RATIO.low * 100)}–${Math.round(INDOOR_OUTDOOR_RATIO.high * 100)}%): US EPA Indoor Air Quality & Building Infiltration Studies.`,
    `WHO 24-hour PM2.5 guideline (${WHO_PM25_24H_GUIDELINE_UGM3} µg/m³): WHO Global Air Quality Guidelines 2021.`
  ];

  return {
    hasData: true,
    availableActions,
    selectedIds: activeIds,
    summary,
    chartData: buildChartData(outdoorPm25, summary),
    community: {
      householdCount: n,
      co2PerWeek: Math.round(summary.totalCo2AvoidedKgWeekly * n * 10) / 10,
      co2PerYear: Math.round(summary.totalCo2AvoidedKgWeekly * 52 * n)
    },
    assumptions
  };
}
