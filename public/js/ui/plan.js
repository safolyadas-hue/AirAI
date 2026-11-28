/**
 * My Plan View
 * Renders live rules actions grouped by timeOfDay and AI dailyPlan text when available.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

const PERIOD_ORDER = ['morning', 'commute', 'midday', 'evening', 'night', 'anytime'];

/**
 * Builds an action card for My Plan.
 * @param {object} act
 * @returns {HTMLElement}
 */
function createActionCard(act) {
  const periodLabel = i18n.plan.periods[act.timeOfDay] || act.timeOfDay;
  return h(
    'div',
    { className: 'card card-interactive col-span-6' },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)'
        }
      },
      h('span', { className: 'badge chip-accent' }, periodLabel)
    ),
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
      act.title
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      act.why
    ),
    h(
      'details',
      { className: 'why-disclosure' },
      h('summary', {}, icon('info', { size: 14 }), i18n.plan.whyDisclosureTitle),
      h('div', { className: 'disclosure-body' }, act.why)
    )
  );
}

/**
 * Builds AI daily plan section or loading/fallback node.
 * @param {any} advice
 * @param {string} adviceStatus
 * @returns {HTMLElement | null}
 */
function createAiPlanSection(advice, adviceStatus) {
  if (adviceStatus === 'loading') {
    return h(
      'div',
      { className: 'card card-tinted col-span-12' },
      h('div', {
        className: 'skeleton-shimmer',
        style: { height: '64px' },
        'aria-label': i18n.status.aiLoading
      })
    );
  }
  if (advice?.dailyPlan) {
    return h(
      'div',
      { className: 'card card-tinted col-span-12' },
      h(
        'h3',
        { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
        i18n.plan.aiSummaryTitle
      ),
      ...PERIOD_ORDER.filter((p) => advice.dailyPlan[p]).map((p) =>
        h(
          'p',
          { style: { fontSize: 'var(--font-size-sm)' } },
          `${i18n.plan.periods[p]}: ${advice.dailyPlan[p]}`
        )
      )
    );
  }
  if (adviceStatus === 'fallback' || adviceStatus === 'error') {
    return h(
      'p',
      {
        className: 'col-span-12',
        style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }
      },
      i18n.status.rulesOnlyNote
    );
  }
  return null;
}

/**
 * Renders the My Plan view.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderPlanView(
  container,
  { rules = null, advice = null, adviceStatus = 'idle' } = {}
) {
  clear(container);

  const headerCard = h(
    'div',
    { className: 'card card-raised col-span-12' },
    h('h2', { id: 'plan-heading' }, i18n.plan.heading),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      i18n.plan.subheading
    )
  );

  const actions = [...(rules?.actions || [])].sort(
    (a, b) => PERIOD_ORDER.indexOf(a.timeOfDay) - PERIOD_ORDER.indexOf(b.timeOfDay)
  );
  const bodyNodes =
    actions.length > 0
      ? actions.map(createActionCard)
      : [
          h(
            'div',
            { className: 'card col-span-12' },
            h(
              'p',
              { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
              i18n.plan.emptyText
            )
          )
        ];

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'plan-heading' },
      headerCard,
      createAiPlanSection(advice, adviceStatus),
      ...bodyNodes
    )
  );
}
