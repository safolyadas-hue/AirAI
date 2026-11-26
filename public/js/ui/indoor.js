/**
 * Indoor Air Quality Hacks View
 * Practical, low-cost engineering hacks to maintain clean indoor sanctuaries during severe smog.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Creates an indoor hack card.
 * @param {string} title
 * @param {string} category
 * @param {string} effort
 * @param {string} cost
 * @param {string} description
 * @param {string} why
 * @returns {HTMLElement}
 */
function createHackCard(title, category, effort, cost, description, why) {
  return h(
    'div',
    { className: 'card card-interactive col-span-6' },
    h(
      'div',
      {
        style: { display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }
      },
      h('span', { className: 'badge chip-accent' }, category),
      h('span', { className: 'badge badge-cost-free' }, cost)
    ),
    h('h3', { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } }, title),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
      description
    ),
    h(
      'details',
      { className: 'why-disclosure' },
      h('summary', {}, icon('info', { size: 14 }), i18n.components.whyThis),
      h('div', { className: 'disclosure-body' }, why)
    )
  );
}

/**
 * Renders the Indoor Air view.
 * @param {HTMLElement} container
 */
export function renderIndoorView(container) {
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

  const hacks = [
    {
      title: 'DIY Corsi-Rosenthal Box Air Cleaner',
      category: i18n.indoor.purifierStatusTitle,
      effort: 'Medium',
      cost: '$30 - $45',
      desc: 'Construct a multi-filter cube with 4 MERV-13 furnace filters and a 20-inch box fan taped together.',
      why: 'Delivers over 500 CFM of clean air delivery rate (CADR), rivaling commercial purifiers at 20% of the cost.'
    },
    {
      title: 'Damp Towel Sealing for Door Sills',
      category: i18n.indoor.sealingTitle,
      effort: 'Low',
      cost: i18n.indoor.freeCost,
      desc: 'Roll damp bath towels along exterior door gaps and drafty window sills to stop infiltration.',
      why: 'Traps infiltration drafts where up to 40% of particulate leakage enters typical apartments.'
    },
    {
      title: 'Kitchen Negative Pressure Isolation',
      category: i18n.indoor.cookingTitle,
      effort: 'Low',
      cost: i18n.indoor.freeCost,
      desc: 'Close kitchen doors and keep exhaust hood running for 10 minutes after cooking finishes.',
      why: 'High-heat oil frying produces concentrated ultrafine particles that disperse across bedrooms if unvented.'
    },
    {
      title: 'Microfiber Damp Mop Over Dry Sweeping',
      category: 'Dust Resuspension',
      effort: 'Low',
      cost: i18n.indoor.freeCost,
      desc: 'Damp-wipe hard floors once daily instead of vacuuming with non-HEPA vacuums.',
      why: 'Standard vacuum exhausts blow microscopic particles straight into your respiratory zone.'
    }
  ];

  const cards = hacks.map((hItem) =>
    createHackCard(hItem.title, hItem.category, hItem.effort, hItem.cost, hItem.desc, hItem.why)
  );

  const view = h(
    'div',
    { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'indoor-heading' },
    header,
    ...cards
  );

  mount(container, view);
}
