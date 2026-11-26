/**
 * Community and Personal Clean Air Impact View
 * Visualizes avoided carbon emissions, indoor particulate reduction, and sustainability milestones.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import { getImpactBadgeTier } from '../domain/impactFactors.js';
import i18n from '../i18n/en.js';

/**
 * Creates a prominent statistical tile.
 * @param {string} title
 * @param {string | number} value
 * @param {string} unit
 * @param {string} iconName
 * @returns {HTMLElement}
 */
function createStatTile(title, value, unit, iconName) {
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
      { style: { display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' } },
      h('span', { className: 'stat-number tabular-nums' }, String(value)),
      h(
        'span',
        { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
        unit
      )
    )
  );
}

/**
 * Renders the clean air impact metrics dashboard view.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 * @param {number} [props.co2SavedKg=14.8]
 * @param {number} [props.indoorReduction=85]
 * @param {number} [props.streakDays=12]
 */
export function renderImpact(
  container,
  { co2SavedKg = 14.8, indoorReduction = 85, streakDays = 12 } = {}
) {
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

  const tier = getImpactBadgeTier(co2SavedKg);

  const tile1 = createStatTile(
    i18n.impact.co2SavedTitle,
    co2SavedKg.toFixed(2),
    i18n.impact.co2Metric,
    'leaf'
  );
  const tile2 = createStatTile(
    i18n.impact.indoorReductionTitle,
    `${indoorReduction}%`,
    i18n.impact.indoorMetric,
    'home'
  );
  const tile3 = createStatTile(
    i18n.impact.routinesCompletedTitle,
    streakDays,
    i18n.impact.routinesMetric,
    'shield'
  );

  const milestoneCard = h(
    'div',
    {
      className: 'card card-tinted col-span-12',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)'
      }
    },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' } },
      icon('check', { size: 28, className: 'chip-accent' }),
      h(
        'div',
        {},
        h(
          'h3',
          { style: { fontSize: 'var(--font-size-md)' } },
          `${i18n.impact.tierBadgeTitle}: ${tier.toUpperCase()}`
        ),
        h(
          'p',
          {
            style: {
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              marginBottom: 0
            }
          },
          i18n.impact.equivalentTrees
        )
      )
    ),
    h(
      'span',
      {
        className: 'badge chip-accent',
        style: { padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)' }
      },
      `${tier.toUpperCase()} TIER`
    )
  );

  const view = h(
    'div',
    { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'impact-heading' },
    header,
    tile1,
    tile2,
    tile3,
    milestoneCard
  );

  mount(container, view);
}

// Backward compatibility helper
export const renderImpactView = renderImpact;
