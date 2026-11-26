/**
 * My Plan & Household Exposure Profile View
 * Renders structured daily routines (morning to night) tailored to user living conditions.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Builds a schedule block card.
 * @param {string} periodName
 * @param {string} iconName
 * @param {string} title
 * @param {string} description
 * @param {string} rationale
 * @returns {HTMLElement}
 */
function createRoutineCard(periodName, iconName, title, description, rationale) {
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
      icon(iconName, { size: 18, className: 'chip-accent' }),
      h('span', { className: 'badge chip-accent' }, periodName)
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
      h('summary', {}, icon('info', { size: 14 }), i18n.plan.whyDisclosureTitle),
      h('div', { className: 'disclosure-body' }, rationale)
    )
  );
}

/**
 * Renders the My Plan view.
 * @param {HTMLElement} container
 * @param {object} props
 * @param {import('../domain/profile.js').UserProfile} [props.profile]
 * @param {Array<object>} [props.routines]
 */
export function renderPlanView(container, { profile = null } = {}) {
  clear(container);

  const headerCard = h(
    'div',
    { className: 'card card-raised col-span-12' },
    h('h2', { id: 'plan-heading' }, i18n.plan.heading),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      i18n.plan.subheading
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-3)',
          flexWrap: 'wrap',
          fontSize: 'var(--font-size-xs)'
        }
      },
      h(
        'span',
        { className: 'chip' },
        icon('location', { size: 14 }),
        profile?.location?.name || 'New Delhi (NCR)'
      ),
      h('span', { className: 'chip' }, icon('shield', { size: 14 }), 'Sensitive Household: Active'),
      h('span', { className: 'chip' }, icon('home', { size: 14 }), 'Purifier: True HEPA Active')
    )
  );

  const routines = [
    {
      period: i18n.plan.morning,
      icon: 'sun',
      title: 'Wet-Mop Hard Floors & Hydrate Airways',
      desc: 'Damp microfiber mopping captures settled coarse PM without resuspension. Sip warm fluids to support airway cilia.',
      why: 'Dry broom sweeping tosses up settled PM10 and PM2.5, raising breathing-zone particle concentrations by 300%.'
    },
    {
      period: i18n.plan.commute,
      icon: 'mask',
      title: 'Certified N95/FFP2 for High-Traffic Travel',
      desc: 'Form-fitted respirator creates an airtight electrostatic barrier against toxic diesel exhaust particulates.',
      why: 'Winter temperature inversions trap diesel soot at tailpipe height. Only electrostatic N95 media blocks ultrafine PM.'
    },
    {
      period: i18n.plan.midday,
      icon: 'home',
      title: 'Seal Drafts & Run Recirculation',
      desc: 'Keep window sashes sealed with damp towels or weatherstrips. Run HEPA filtration on medium speed.',
      why: 'Infiltration rate drops by 50% when drafts are sealed, keeping indoor PM2.5 concentrations below 15 µg/m³.'
    },
    {
      period: i18n.plan.evening,
      icon: 'flame',
      title: 'Kitchen Exhaust Active & Flame Suppression',
      desc: 'Use range hood fan during cooking. Refrain from lighting scented candles or burning incense sticks.',
      why: 'Incense and unvented gas cooktops generate indoor nitrogen dioxide and VOC levels comparable to heavy traffic.'
    },
    {
      period: i18n.plan.night,
      icon: 'moon',
      title: 'Quiet Overnight Air Sanctuary',
      desc: 'Operate bedroom air cleaner on quiet sleep mode to sustain clean recovery air through 8 hours of sleep.',
      why: 'Overnight rest in clean air lowers systemic blood markers of inflammation caused by daytime smog inhalation.'
    }
  ];

  const routineCards = routines.map((r) =>
    createRoutineCard(r.period, r.icon, r.title, r.desc, r.why)
  );

  const view = h(
    'div',
    { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'plan-heading' },
    headerCard,
    ...routineCards
  );

  mount(container, view);
}

// Backward compatibility helper
export const renderOnboarding = (container, currentProfile) =>
  renderPlanView(container, { profile: currentProfile });
