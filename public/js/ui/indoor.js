/**
 * Indoor Air Quality Hacks View
 * Ranked cost tiers, DIY Corsi-Rosenthal box card, ventilation timing, cooking/heating safety, and room checklist.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';
import { createCorsiRosenthalSvg } from './indoorBoxSvg.js';

/** In-memory room checklist state (never persisted). */
const checkedRooms = new Set();

function createIndoorActionCard(act) {
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
    h('h4', { style: { marginBottom: 'var(--space-2)' } }, act.title),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      act.why
    ),
    act.impact?.pm25ReductionRange
      ? h(
          'p',
          {
            style: {
              fontSize: 'var(--font-size-xs)',
              color: 'var(--accent-text)',
              marginTop: 'var(--space-2)',
              fontWeight: '600'
            }
          },
          `${i18n.plan.estimatedPrefix}: -${act.impact.pm25ReductionRange.min}–${act.impact.pm25ReductionRange.max}% PM2.5`
        )
      : null
  );
}

function createDiyBoxCard(prominent) {
  const body = h(
    'div',
    {},
    createCorsiRosenthalSvg(),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' } },
      `${i18n.indoor.diyMaterialsTitle}: ${i18n.indoor.diyMaterials}`
    ),
    h(
      'ol',
      {
        style: {
          paddingLeft: '1.25rem',
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--space-2)'
        }
      },
      ...i18n.indoor.diySteps.map((s) => h('li', {}, s))
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      i18n.indoor.diyWhy
    )
  );

  if (prominent) {
    return h(
      'div',
      { className: 'card card-tinted col-span-12' },
      h(
        'h3',
        { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-1)' } },
        i18n.indoor.diyTitle
      ),
      h(
        'p',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        i18n.indoor.diySummary
      ),
      body
    );
  }

  return h(
    'details',
    { className: 'card col-span-12' },
    h(
      'summary',
      { style: { fontWeight: '600', cursor: 'pointer' } },
      `${i18n.indoor.diyTitle} — ${i18n.indoor.diySummary}`
    ),
    h('div', { style: { marginTop: 'var(--space-3)' } }, body)
  );
}

function createVentAndSafetyCards(vm) {
  const vent = vm.ventilation;
  const best = vent?.bestWindow;
  const ventMsg = best
    ? (vent.hasSafeWindow ? i18n.indoor.ventOpenMsg : i18n.indoor.ventClosedMsg)
        .replace('{time}', String(best.time))
        .replace('{aqi}', String(Math.round(best.aqi)))
    : i18n.indoor.emptyText;

  const ventCard = h(
    'div',
    { className: 'card col-span-6' },
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
      i18n.indoor.ventTitle
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      ventMsg
    )
  );

  const ch = vm.cookingHeating || { cooking: 'induction', heating: 'electric' };
  const safetyCard = h(
    'div',
    { className: 'card col-span-6' },
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
      i18n.indoor.safetyTitle
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' } },
      i18n.indoor.cookingNotes[ch.cooking] || ''
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      i18n.indoor.heatingNotes[ch.heating] || ''
    )
  );

  return { ventCard, safetyCard };
}

function createChecklistCard() {
  return h(
    'div',
    { className: 'card col-span-12' },
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' } },
      i18n.indoor.checklistTitle
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' } },
      ...i18n.indoor.checklistRooms.map((rm) =>
        h(
          'label',
          { className: 'checkbox-row', for: `room-check-${rm.id}` },
          h('input', {
            id: `room-check-${rm.id}`,
            type: 'checkbox',
            checked: checkedRooms.has(rm.id),
            onChange: (e) => {
              if (/** @type {HTMLInputElement} */ (e.target).checked) checkedRooms.add(rm.id);
              else checkedRooms.delete(rm.id);
            }
          }),
          h('span', {}, rm.label)
        )
      )
    )
  );
}

/**
 * Renders the Indoor Air view from a precomputed view model.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderIndoorView(container, { vm = null } = {}) {
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

  const groups = vm?.groups || { free: [], low: [], invest: [] };
  const tierNodes = ['free', 'low', 'invest']
    .filter((t) => groups[t]?.length > 0)
    .map((t) =>
      h(
        'section',
        { className: 'col-span-12' },
        h('h3', { style: { marginBottom: 'var(--space-2)' } }, i18n.indoor.tiers[t]),
        h('div', { className: 'bento-grid' }, ...groups[t].map(createIndoorActionCard))
      )
    );

  const { ventCard, safetyCard } = createVentAndSafetyCards(vm || {});
  const aiTips = vm?.aiIndoorTips?.length
    ? h(
        'div',
        { className: 'card card-tinted col-span-12' },
        h(
          'h3',
          { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
          icon('info', { size: 16 }),
          ` ${i18n.indoor.aiTipsTitle}`
        ),
        ...vm.aiIndoorTips.map((tip) =>
          h('p', { style: { fontSize: 'var(--font-size-sm)' } }, `• ${tip}`)
        )
      )
    : null;

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'indoor-heading' },
      header,
      ...tierNodes,
      createDiyBoxCard(Boolean(vm?.diyProminent)),
      ventCard,
      safetyCard,
      createChecklistCard(),
      aiTips
    )
  );
}
