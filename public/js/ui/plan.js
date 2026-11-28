/**
 * My Plan View
 * Renders 5 daily timeline blocks, in-memory completion checkboxes, progress bar, and impact disclosures.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import { announce } from './a11y.js';
import i18n from '../i18n/en.js';

/** In-memory completed action IDs (never persisted to localStorage). */
const completedActionIds = new Set();

function createImpactDetails(act) {
  const imp = act.impact;
  const lines = [];
  if (act.aiExplanation)
    lines.push(h('p', { style: { marginBottom: 'var(--space-1)' } }, act.aiExplanation));
  if (imp?.pm25ReductionRange) {
    lines.push(
      h(
        'p',
        { style: { marginBottom: 'var(--space-1)' } },
        i18n.plan.pm25RangeLabel
          .replace('{min}', String(imp.pm25ReductionRange.min))
          .replace('{max}', String(imp.pm25ReductionRange.max))
      )
    );
  }
  if (imp && imp.co2KgPerWeek > 0) {
    lines.push(
      h(
        'p',
        { style: { marginBottom: 'var(--space-1)' } },
        i18n.plan.co2WeeklyLabel.replace('{kg}', String(imp.co2KgPerWeek))
      )
    );
  }
  if (imp?.confidence) {
    lines.push(
      h(
        'p',
        { style: { marginBottom: 'var(--space-1)', fontWeight: '600' } },
        i18n.plan.confidenceLabel.replace('{level}', imp.confidence)
      )
    );
  }
  if (imp?.assumption) lines.push(h('p', {}, `${i18n.plan.estimatedPrefix}: ${imp.assumption}`));
  if (lines.length === 0) lines.push(h('p', {}, act.why));

  return h(
    'details',
    { className: 'why-disclosure' },
    h('summary', {}, icon('info', { size: 14 }), i18n.plan.whyImpactTitle),
    h('div', { className: 'disclosure-body' }, ...lines)
  );
}

function createPlanActionCard(act, onToggle) {
  const isDone = completedActionIds.has(act.id);
  const checkId = `plan-done-${act.id}`;

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
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)',
          flexWrap: 'wrap'
        }
      },
      h(
        'div',
        { style: { display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' } },
        h('span', { className: 'badge chip-accent' }, `${act.effort} effort`),
        h('span', { className: 'badge badge-cost-free' }, act.costTier)
      ),
      h(
        'label',
        {
          for: checkId,
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '600',
            cursor: 'pointer'
          }
        },
        h('input', {
          id: checkId,
          type: 'checkbox',
          checked: isDone,
          onChange: (e) => {
            const checked = /** @type {HTMLInputElement} */ (e.target).checked;
            if (checked) completedActionIds.add(act.id);
            else completedActionIds.delete(act.id);
            const msg = (checked ? i18n.plan.doneAnnounced : i18n.plan.undoneAnnounced).replace(
              '{title}',
              act.title
            );
            announce(msg);
            onToggle();
          }
        }),
        i18n.plan.doneCheckboxLabel
      )
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
    createImpactDetails(act)
  );
}

function renderProgressCard(totalActions) {
  const doneCount = Math.min(completedActionIds.size, totalActions);
  const pct = totalActions > 0 ? Math.round((doneCount / totalActions) * 100) : 0;
  const label = i18n.plan.progressLabel
    .replace('{done}', String(doneCount))
    .replace('{total}', String(totalActions));

  return h(
    'div',
    { className: 'card card-tinted col-span-12' },
    h('p', { style: { fontWeight: '600', fontSize: 'var(--font-size-sm)' } }, label),
    h(
      'div',
      {
        className: 'progress-bar-track',
        role: 'progressbar',
        'aria-valuenow': String(doneCount),
        'aria-valuemin': '0',
        'aria-valuemax': String(totalActions),
        'aria-label': label
      },
      h('div', { className: 'progress-bar-fill', style: { width: `${pct}%` } })
    )
  );
}

/**
 * Renders the My Plan view from a precomputed plan view model.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderPlanView(container, { vm = null } = {}) {
  clear(container);
  const rerender = () => renderPlanView(container, { vm });

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

  const blocks = vm?.blocks || [];
  const totalActions = vm?.totalActions || 0;

  if (totalActions === 0) {
    mount(
      container,
      h(
        'div',
        { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'plan-heading' },
        headerCard,
        h(
          'div',
          { className: 'card col-span-12' },
          h(
            'p',
            { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
            i18n.plan.emptyText
          )
        )
      )
    );
    return;
  }

  const blockNodes = blocks
    .filter((b) => b.actions.length > 0 || b.aiNote)
    .map((b) =>
      h(
        'section',
        { className: 'col-span-12', 'aria-labelledby': `plan-block-${b.id}` },
        h(
          'h3',
          { id: `plan-block-${b.id}`, style: { marginBottom: 'var(--space-2)' } },
          i18n.plan.periods[b.id] || b.id
        ),
        b.aiNote
          ? h(
              'p',
              {
                style: {
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-3)'
                }
              },
              b.aiNote
            )
          : null,
        h(
          'div',
          { className: 'bento-grid' },
          ...b.actions.map((a) => createPlanActionCard(a, rerender))
        )
      )
    );

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'plan-heading' },
      headerCard,
      renderProgressCard(totalActions),
      ...blockNodes
    )
  );
}
