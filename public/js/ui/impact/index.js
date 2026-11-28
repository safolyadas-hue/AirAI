/**
 * Impact What-If Dashboard View Entry Point
 */
import { h, clear, mount } from '../dom.js';
import { icon } from '../icons.js';
import { announce } from '../a11y.js';
import i18n from '../../i18n/en.js';
import { createBeforeAfterChart } from './chart.js';
import { createWhatIfToggles } from './toggles.js';
import { createAssumptionsCard } from './assumptions.js';

let inMemorySelectedIds = null;
let announceTimer = null;

/**
 * Checks whether the user prefers reduced motion.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * Animates a numeric readout from 0 to target unless reduced motion is enabled.
 * @param {HTMLElement} el
 * @param {number} target
 * @param {(val: number) => string} formatFn
 */
export function animateMetric(el, target, formatFn) {
  if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function' || target === 0) {
    el.textContent = formatFn(target);
    return;
  }
  const start = performance.now();
  const duration = 350;
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    el.textContent = formatFn(target * progress);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function createStatTile(title, displayEl, unit, iconName) {
  return h(
    'div',
    { className: 'stat-tile col-span-4' },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' } },
      icon(iconName, { size: 18 }),
      h(
        'span',
        {
          style: {
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            fontWeight: '600'
          }
        },
        title
      )
    ),
    h(
      'div',
      {
        style: { display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', flexWrap: 'wrap' }
      },
      displayEl,
      h(
        'span',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        unit
      )
    )
  );
}

function createCommunityCard(community) {
  return h(
    'div',
    { className: 'card card-tinted col-span-12' },
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
      i18n.impact.communityTitle.replace('{count}', String(community.householdCount))
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)' } },
      i18n.impact.communityWeekly.replace('{kg}', String(community.co2PerWeek))
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      i18n.impact.communityYearly.replace('{kg}', String(community.co2PerYear))
    )
  );
}

function buildTilesRow(summary) {
  const pm25El = h(
    'span',
    { className: 'stat-number tabular-nums' },
    `${summary.estimatedIndoorPm25ReductionPercent.min}–${summary.estimatedIndoorPm25ReductionPercent.max}%`
  );
  const co2El = h('span', { className: 'stat-number tabular-nums' }, '');
  const countEl = h('span', { className: 'stat-number tabular-nums' }, String(summary.actionCount));
  animateMetric(co2El, summary.totalCo2AvoidedKgWeekly, (v) => v.toFixed(1));
  return [
    createStatTile(i18n.impact.pm25TileTitle, pm25El, i18n.impact.estimatedLabel, 'home'),
    createStatTile(i18n.impact.co2TileTitle, co2El, 'kg / week', 'leaf'),
    createStatTile(i18n.impact.countTileTitle, countEl, 'selected', 'shield')
  ];
}

/**
 * Renders the Impact what-if dashboard.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderImpact(container, { selectModel } = {}) {
  clear(container);
  const vm =
    typeof selectModel === 'function' ? selectModel(inMemorySelectedIds) : { hasData: false };
  const header = h(
    'div',
    { className: 'card card-raised col-span-12' },
    h('h2', { id: 'impact-heading' }, i18n.impact.heading),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      i18n.impact.subheading
    )
  );

  if (!vm?.hasData) {
    mount(
      container,
      h(
        'div',
        { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'impact-heading' },
        header,
        h(
          'div',
          {
            className: 'card col-span-12',
            style: { textAlign: 'center', padding: 'var(--space-6)' }
          },
          icon('leaf', { size: 28 }),
          h('h3', { style: { marginTop: 'var(--space-2)' } }, i18n.impact.emptyTitle),
          h(
            'p',
            {
              style: {
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                marginInline: 'auto'
              }
            },
            i18n.impact.emptyBody
          )
        )
      )
    );
    return;
  }

  inMemorySelectedIds = vm.selectedIds;
  const onToggle = (id, checked) => {
    const next = new Set(inMemorySelectedIds || []);
    if (checked) next.add(id);
    else next.delete(id);
    inMemorySelectedIds = [...next];
    renderImpact(container, { selectModel });
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      const updated = selectModel(inMemorySelectedIds);
      announce(
        `${updated.summary.actionCount} actions selected. Estimated PM2.5 reduction ${updated.summary.estimatedIndoorPm25ReductionPercent.min} to ${updated.summary.estimatedIndoorPm25ReductionPercent.max} percent.`
      );
    }, 150);
  };

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'impact-heading' },
      header,
      ...buildTilesRow(vm.summary),
      createWhatIfToggles({
        availableActions: vm.availableActions,
        selectedIds: vm.selectedIds,
        onToggle
      }),
      createBeforeAfterChart(vm.chartData),
      createCommunityCard(vm.community),
      createAssumptionsCard(vm.assumptions)
    )
  );
}

export const renderImpactView = renderImpact;
