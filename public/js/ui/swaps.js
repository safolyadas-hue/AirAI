/**
 * Greener Urban Swaps View
 * Connects individual consumer routines to measurable urban emission reductions.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Creates a sustainable swap card.
 * @param {string} title
 * @param {string} category
 * @param {string} iconName
 * @param {string} metric
 * @param {string} description
 * @param {string} why
 * @returns {HTMLElement}
 */
function createSwapCard(title, category, iconName, metric, description, why) {
  return h(
    'div',
    { className: 'card card-interactive col-span-6' },
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-2)'
        }
      },
      h(
        'span',
        {
          className: 'badge chip-accent',
          style: { display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }
        },
        icon(iconName, { size: 14 }),
        category
      ),
      h('span', { className: 'badge badge-cost-free', style: { fontWeight: '700' } }, metric)
    ),
    h('h3', { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } }, title),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
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
 * Renders the Greener Swaps view.
 * @param {HTMLElement} container
 */
export function renderSwapsView(container) {
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

  const swaps = [
    {
      title: 'Shift Car Commute to Metro Transit',
      category: i18n.swaps.commuteSwapsTitle,
      icon: 'bus',
      metric: '-1.03 kg CO₂ / 10km',
      desc: 'Swap solo car trips to the electric metro system during peak winter inversion episodes.',
      why: 'One metro train eliminates tailpipe exhaust from up to 800 personal passenger cars.'
    },
    {
      title: 'Transition Gas Burners to Induction Plate',
      category: i18n.swaps.heatingCookingTitle,
      icon: 'leaf',
      metric: 'Zero NO₂ Indoors',
      desc: 'Use an electric induction plate for long stews and boils instead of unvented LPG flames.',
      why: 'Methane gas stoves emit unburned nitrogen dioxide and benzene directly into indoor living spaces.'
    },
    {
      title: 'Carpooling & Route Chaining',
      category: 'Trip Efficiency',
      icon: 'bike',
      metric: '-50% Travel Exhaust',
      desc: 'Combine school drop-offs and grocery runs into a single consolidated trip.',
      why: 'Cold vehicle engine starts produce 5x more unburned hydrocarbon emissions during the first 5 minutes.'
    },
    {
      title: 'Ditch Wood & Coal Space Heating',
      category: 'Solid Fuel Alternative',
      icon: 'flame',
      metric: '-99% Ambient Soot',
      desc: 'Use radiator oil heaters or heat pumps rather than open hearth fires or charcoal angithis.',
      why: 'Solid biomass heating is the single highest contributor to ground-level winter carbon black soot.'
    }
  ];

  const cards = swaps.map((s) =>
    createSwapCard(s.title, s.category, s.icon, s.metric, s.desc, s.why)
  );

  const view = h(
    'div',
    { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'swaps-heading' },
    header,
    ...cards
  );

  mount(container, view);
}
