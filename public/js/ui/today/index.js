/**
 * Today / Air Quality Dashboard View Entry Point
 * Composes hero, safety banner, family narrative, stagnation explainer, timeline, actions, and print summary.
 */
import { h, clear, mount } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';
import { createHeroCard } from './hero.js';
import { createTimelineSection, updateTimelineFade } from './timeline.js';
import { createActionsSection } from './actions.js';

export { updateTimelineFade };

let wasPreviouslySevere = false;

function renderStatusCard(status, onRetry) {
  if (status === 'loading') {
    return h(
      'div',
      { className: 'bento-grid' },
      h(
        'div',
        { className: 'card col-span-12', role: 'status', 'aria-live': 'polite' },
        h('div', {
          className: 'skeleton-shimmer',
          style: { height: '140px', marginBottom: 'var(--space-3)' }
        }),
        h(
          'p',
          { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
          i18n.status.loadingAir
        )
      )
    );
  }
  return h(
    'div',
    { className: 'bento-grid' },
    h(
      'div',
      { className: 'card card-raised col-span-12', role: 'alert' },
      h('h2', {}, i18n.status.errorTitle),
      h(
        'p',
        { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
        i18n.status.errorBody
      ),
      h(
        'button',
        {
          type: 'button',
          className: 'btn btn-primary',
          style: { marginTop: 'var(--space-3)' },
          onClick: onRetry
        },
        icon('refresh', { size: 16 }),
        i18n.status.retryButton
      )
    )
  );
}

function createInfoCards(vm) {
  const { stagnation, familyNarrative, safetyBanner } = vm;
  const triggerAlert = Boolean(safetyBanner?.show && !wasPreviouslySevere);
  wasPreviouslySevere = Boolean(safetyBanner?.show);

  const safetyNode = safetyBanner?.show
    ? h(
        'div',
        {
          className: 'safety-banner col-span-12',
          role: triggerAlert ? 'alert' : 'region',
          'aria-label': i18n.today.safetyTitle
        },
        h(
          'h3',
          { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-1)' } },
          i18n.today.safetyTitle
        ),
        h('p', { style: { fontSize: 'var(--font-size-sm)' } }, i18n.today.safetyBody)
      )
    : null;

  const familyCard = h(
    'div',
    { className: 'card card-tinted col-span-6' },
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
      i18n.today.familyTitle
    ),
    h('p', { style: { fontSize: 'var(--font-size-sm)' } }, familyNarrative)
  );

  const fmt = (v, unit) => (typeof v === 'number' ? `${Math.round(v)} ${unit}` : '—');
  const metricsText = i18n.today.stagnationMetrics
    .replace('{wind}', fmt(stagnation.windSpeed, 'km/h'))
    .replace('{temp}', fmt(stagnation.temperature, '°C'))
    .replace('{humidity}', fmt(stagnation.humidity, '%'));

  const stagnationCard = h(
    'div',
    { className: 'card col-span-6' },
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
      i18n.today.stagnationTitle
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      i18n.today.stagnationExplain[stagnation.risk] || i18n.today.stagnationExplain.low
    ),
    h(
      'p',
      {
        style: {
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          marginTop: 'var(--space-2)'
        }
      },
      metricsText
    )
  );

  return { safetyNode, familyCard, stagnationCard };
}

function createPrintSummary(vm) {
  const dateStr = new Date().toLocaleDateString();
  const grouped = (vm.allPlanActions || []).map((a) =>
    h('li', {}, `[${i18n.plan.periods[a.timeOfDay] || a.timeOfDay}] ${a.title}`)
  );
  return h(
    'section',
    { className: 'print-only col-span-12', 'aria-hidden': 'true' },
    h(
      'h2',
      {},
      `${i18n.app.title} — ${vm.locationName || 'Location'} (US AQI ${Math.round(vm.aqi)})`
    ),
    h('p', {}, dateStr),
    grouped.length > 0
      ? h('ul', { style: { paddingLeft: '1.25rem', marginBlock: 'var(--space-2)' } }, ...grouped)
      : null,
    h('p', {}, i18n.today.printIndoorEssentials),
    h(
      'p',
      { style: { fontWeight: '600', marginTop: 'var(--space-2)' } },
      i18n.today.printDisclaimer
    )
  );
}

/**
 * Renders the Today dashboard view from a precomputed view model.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderTodayView(
  container,
  {
    vm = null,
    onRefresh = () => {},
    onRetry = () => {},
    onPrint = () => typeof window !== 'undefined' && window.print?.()
  } = {}
) {
  clear(container);
  if (!vm || vm.status === 'loading' || vm.status === 'error' || !vm.airSnapshot) {
    mount(container, renderStatusCard(vm?.status === 'loading' ? 'loading' : 'error', onRetry));
    return;
  }

  const aiNote =
    vm.adviceStatus === 'loading'
      ? h('div', {
          className: 'skeleton-shimmer',
          style: { height: '18px', width: '60%' },
          'aria-label': i18n.status.aiLoading
        })
      : vm.adviceStatus === 'fallback' || vm.adviceStatus === 'error'
        ? h(
            'p',
            { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
            i18n.status.rulesOnlyNote
          )
        : null;

  const { safetyNode, familyCard, stagnationCard } = createInfoCards(vm);

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up' },
      createPrintSummary(vm),
      createHeroCard({
        snapshot: vm.airSnapshot,
        categoryKey: vm.categoryKey,
        categoryLabel: vm.categoryLabel,
        headlineText: vm.headline || i18n.today.riskBannerTitle,
        aiNote,
        lastUpdatedAt: vm.lastUpdatedAt,
        onRefresh,
        onPrint
      }),
      safetyNode,
      familyCard,
      stagnationCard,
      createTimelineSection(vm.hourlyPoints, vm.hourlyAnalysis),
      createActionsSection(vm.topActions)
    )
  );
}

export const renderDashboard = (container, props) => renderTodayView(container, props);
