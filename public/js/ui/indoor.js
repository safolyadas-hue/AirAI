/**
 * Indoor Air Quality Hacks View
 * Renders live rules actions in the indoor and mitigation categories plus AI indoorTips.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Builds an indoor action card.
 * @param {object} act
 * @returns {HTMLElement}
 */
function createIndoorCard(act) {
  return h(
    'div',
    { className: 'card card-interactive col-span-6' },
    h(
      'div',
      {
        style: { display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }
      },
      h('span', { className: 'badge chip-accent' }, act.category),
      h('span', { className: 'badge badge-cost-free' }, act.costTier)
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
      h('summary', {}, icon('info', { size: 14 }), i18n.components.whyThis),
      h('div', { className: 'disclosure-body' }, act.why)
    )
  );
}

/**
 * Builds AI indoor tips or loading/fallback node.
 * @param {any} advice
 * @param {string} adviceStatus
 * @returns {HTMLElement | null}
 */
function createAiIndoorSection(advice, adviceStatus) {
  if (adviceStatus === 'loading') {
    return h(
      'div',
      { className: 'card card-tinted col-span-12' },
      h('div', { className: 'skeleton-shimmer', style: { height: '48px' } })
    );
  }
  if (Array.isArray(advice?.indoorTips) && advice.indoorTips.length > 0) {
    return h(
      'div',
      { className: 'card card-tinted col-span-12' },
      h(
        'h3',
        { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
        i18n.indoor.aiTipsTitle
      ),
      ...advice.indoorTips.map((tip) =>
        h('p', { style: { fontSize: 'var(--font-size-sm)' } }, `• ${tip}`)
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
 * Renders the Indoor Air view.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderIndoorView(
  container,
  { rules = null, advice = null, adviceStatus = 'idle' } = {}
) {
  clear(container);

  const header = h(
    'div',
    { className: 'card card-raised col-span-12' },
    h('h2', { id: 'indoor-heading' }, i18n.indoor.heading),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      i18n.indoor.subheading
    )
  );

  const indoorActions = (rules?.actions || []).filter(
    (a) => a.category === 'indoor' || a.category === 'mitigation'
  );
  const cards =
    indoorActions.length > 0
      ? indoorActions.map(createIndoorCard)
      : [
          h(
            'div',
            { className: 'card col-span-12' },
            h(
              'p',
              { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
              i18n.indoor.emptyText
            )
          )
        ];

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'indoor-heading' },
      header,
      createAiIndoorSection(advice, adviceStatus),
      ...cards
    )
  );
}
