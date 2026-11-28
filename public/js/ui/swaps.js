/**
 * Greener Urban Swaps View
 * Personalized swaps grouped by area plus community "if 100 households" impact cards.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

function createSwapCard(act) {
  const imp = act.impact;
  return h(
    'div',
    { className: 'card card-interactive col-span-6' },
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-2)',
          gap: 'var(--space-2)',
          flexWrap: 'wrap'
        }
      },
      h('span', { className: 'badge chip-accent' }, icon('leaf', { size: 14 }), act.costTier),
      h('span', { className: 'badge badge-cost-free' }, `${act.effort} effort`)
    ),
    h('h4', { style: { marginBottom: 'var(--space-2)' } }, act.title),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      `${i18n.swaps.whatChangesPrefix} ${act.why}`
    ),
    imp
      ? h(
          'div',
          {
            style: {
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              marginTop: 'var(--space-2)'
            }
          },
          imp.co2KgPerWeek > 0
            ? h(
                'span',
                { className: 'chip badge-cost-free' },
                `${i18n.plan.estimatedPrefix}: -${imp.co2KgPerWeek} kg CO₂/wk`
              )
            : null,
          imp.pm25ReductionRange
            ? h(
                'span',
                { className: 'chip chip-accent' },
                `${i18n.plan.estimatedPrefix}: -${imp.pm25ReductionRange.min}–${imp.pm25ReductionRange.max}% PM2.5`
              )
            : null
        )
      : null
  );
}

function createCommunitySection(communityActions = []) {
  const cards = communityActions.map((item) => {
    const copy = i18n.swaps.communityItems[item.id] || { title: item.id, desc: '' };
    return h(
      'div',
      { className: 'card col-span-6' },
      h('h4', { style: { marginBottom: 'var(--space-1)' } }, copy.title),
      h(
        'p',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        copy.desc
      ),
      h(
        'p',
        {
          style: {
            fontSize: 'var(--font-size-xs)',
            color: 'var(--accent-text)',
            fontWeight: '600',
            marginTop: 'var(--space-2)'
          }
        },
        item.communityEstimate
      )
    );
  });

  return h(
    'section',
    { className: 'col-span-12' },
    h('h3', { style: { marginBottom: 'var(--space-2)' } }, i18n.swaps.communityTitle),
    h('div', { className: 'bento-grid' }, ...cards)
  );
}

/**
 * Renders the Greener Swaps view from a precomputed view model.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderSwapsView(container, { vm = null } = {}) {
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

  const groups = vm?.groups || { commute: [], cooking: [], heating: [] };
  const areaNodes = ['commute', 'cooking', 'heating']
    .filter((area) => groups[area]?.length > 0)
    .map((area) =>
      h(
        'section',
        { className: 'col-span-12' },
        h('h3', { style: { marginBottom: 'var(--space-2)' } }, i18n.swaps.areas[area]),
        h('div', { className: 'bento-grid' }, ...groups[area].map(createSwapCard))
      )
    );

  const emptyPersonal =
    areaNodes.length === 0
      ? h(
          'div',
          { className: 'card col-span-12' },
          h(
            'p',
            { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
            i18n.swaps.emptyText
          )
        )
      : null;

  const aiSwapsNode = vm?.aiSwaps?.length
    ? h(
        'div',
        { className: 'card card-tinted col-span-12' },
        h(
          'h3',
          { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
          i18n.swaps.aiSwapsTitle
        ),
        ...vm.aiSwaps.map((s) => h('p', { style: { fontSize: 'var(--font-size-sm)' } }, `• ${s}`))
      )
    : null;

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'swaps-heading' },
      header,
      emptyPersonal,
      ...areaNodes,
      aiSwapsNode,
      createCommunitySection(vm?.communityActions || [])
    )
  );
}
