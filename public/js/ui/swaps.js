/**
 * Greener Urban Swaps View
 * Renders live rules actions in the swap category plus AI swaps when available.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Builds a swap action card.
 * @param {object} act
 * @returns {HTMLElement}
 */
function createSwapCard(act) {
  return h(
    'div',
    { className: 'card card-interactive col-span-6' },
    h(
      'div',
      {
        style: { display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }
      },
      h('span', { className: 'badge chip-accent' }, icon('leaf', { size: 14 }), act.category),
      h('span', { className: 'badge badge-cost-free' }, act.effort)
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
 * Builds AI swaps or loading/fallback node.
 * @param {any} advice
 * @param {string} adviceStatus
 * @returns {HTMLElement | null}
 */
function createAiSwapsSection(advice, adviceStatus) {
  if (adviceStatus === 'loading') {
    return h(
      'div',
      { className: 'card card-tinted col-span-12' },
      h('div', { className: 'skeleton-shimmer', style: { height: '48px' } })
    );
  }
  if (Array.isArray(advice?.swaps) && advice.swaps.length > 0) {
    return h(
      'div',
      { className: 'card card-tinted col-span-12' },
      h(
        'h3',
        { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
        i18n.swaps.aiSwapsTitle
      ),
      ...advice.swaps.map((s) => h('p', { style: { fontSize: 'var(--font-size-sm)' } }, `• ${s}`))
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
 * Renders the Greener Swaps view.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderSwapsView(
  container,
  { rules = null, advice = null, adviceStatus = 'idle' } = {}
) {
  clear(container);

  const header = h(
    'div',
    { className: 'card card-raised col-span-12' },
    h('h2', { id: 'swaps-heading' }, i18n.swaps.heading),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      i18n.swaps.subheading
    )
  );

  const swapActions = (rules?.actions || []).filter((a) => a.category === 'swap');
  const cards =
    swapActions.length > 0
      ? swapActions.map(createSwapCard)
      : [
          h(
            'div',
            { className: 'card col-span-12' },
            h(
              'p',
              { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
              i18n.swaps.emptyText
            )
          )
        ];

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'swaps-heading' },
      header,
      createAiSwapsSection(advice, adviceStatus),
      ...cards
    )
  );
}
