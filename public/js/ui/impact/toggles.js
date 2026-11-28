/**
 * Impact What-If - Action Toggles Grouped by Area
 */
import { h } from '../dom.js';
import i18n from '../../i18n/en.js';

/**
 * Builds grouped action checkboxes for the what-if panel.
 * @param {{ availableActions: Array<any>, selectedIds: string[], onToggle: (id: string, checked: boolean) => void }} opts
 * @returns {HTMLElement}
 */
export function createWhatIfToggles({ availableActions, selectedIds, onToggle }) {
  const areas = ['protection', 'home', 'commute'];
  const groups = areas
    .map((area) => {
      const items = availableActions.filter((a) => a.area === area);
      if (items.length === 0) return null;
      return h(
        'div',
        { style: { marginBottom: 'var(--space-3)' } },
        h(
          'h4',
          {
            style: {
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-2)',
              color: 'var(--color-text-muted)'
            }
          },
          i18n.impact.areas[area]
        ),
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' } },
          ...items.map((act) => {
            const cbId = `impact-toggle-${act.id}`;
            return h(
              'label',
              { className: 'checkbox-row', for: cbId },
              h('input', {
                id: cbId,
                type: 'checkbox',
                checked: selectedIds.includes(act.id),
                onChange: (e) =>
                  onToggle(act.id, /** @type {HTMLInputElement} */ (e.target).checked)
              }),
              h('span', {}, act.title)
            );
          })
        )
      );
    })
    .filter(Boolean);

  return h(
    'div',
    { className: 'card col-span-12' },
    h(
      'h3',
      { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' } },
      i18n.impact.togglesTitle
    ),
    ...groups
  );
}
