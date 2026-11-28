/**
 * Clean Air Impact View
 * Placeholder empty state until interactive impact modeling in Step 6.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Renders the Impact view empty state.
 * @param {HTMLElement} container
 */
export function renderImpact(container) {
  clear(container);

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

  const emptyCard = h(
    'div',
    { className: 'card col-span-12', style: { textAlign: 'center', padding: 'var(--space-8)' } },
    icon('leaf', { size: 32 }),
    h(
      'h3',
      { style: { marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' } },
      i18n.impact.comingTitle
    ),
    h(
      'p',
      {
        style: {
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
          marginInline: 'auto'
        }
      },
      i18n.impact.comingBody
    )
  );

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'impact-heading' },
      header,
      emptyCard
    )
  );
}

export const renderImpactView = renderImpact;
