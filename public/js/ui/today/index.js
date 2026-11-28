/**
 * Today / Air Quality Dashboard View Entry Point
 * Composes hero, timeline, and priority actions. Purely render-only.
 */
import { h, clear, mount } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';
import { createHeroCard } from './hero.js';
import { createTimelineSection, updateTimelineFade } from './timeline.js';
import { createActionsSection } from './actions.js';

export { updateTimelineFade };

function renderStatusCard(status, onRetry) {
  if (status === 'loading') {
    return h(
      'div',
      { className: 'bento-grid' },
      h(
        'div',
        { className: 'card col-span-12', role: 'status', 'aria-live': 'polite' },
        h('div', {
          className: 'skeleton-shimmer',
          style: { height: '140px', marginBottom: 'var(--space-3)' }
        }),
        h(
          'p',
          { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
          i18n.status.loadingAir
        )
      )
    );
  }
  return h(
    'div',
    { className: 'bento-grid' },
    h(
      'div',
      { className: 'card card-raised col-span-12', role: 'alert' },
      h('h2', {}, i18n.status.errorTitle),
      h(
        'p',
        { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
        i18n.status.errorBody
      ),
      h(
        'button',
        {
          type: 'button',
          className: 'btn btn-primary',
          style: { marginTop: 'var(--space-3)' },
          onClick: onRetry
        },
        icon('refresh', { size: 16 }),
        i18n.status.retryButton
      )
    )
  );
}

/**
 * Renders the Today dashboard view into the target container.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderTodayView(
  container,
  {
    status = 'idle',
    air = null,
    hourly = null,
    rules = null,
    advice = null,
    adviceStatus = 'idle',
    categoryKey = 'unhealthy',
    categoryLabel = 'Unhealthy',
    lastUpdatedAt = null,
    onRefresh = () => {},
    onRetry = () => {}
  } = {}
) {
  clear(container);
  if (status === 'loading' || status === 'error' || !air || !rules) {
    mount(container, renderStatusCard(status === 'loading' ? 'loading' : 'error', onRetry));
    return;
  }

  const snapshot = air.airSnapshot;
  const headlineText = advice?.summary || rules.headline || i18n.today.riskBannerTitle;
  const aiNote =
    adviceStatus === 'loading'
      ? h('div', {
          className: 'skeleton-shimmer',
          style: { height: '18px', width: '60%' },
          'aria-label': i18n.status.aiLoading
        })
      : adviceStatus === 'fallback' || adviceStatus === 'error'
        ? h(
            'p',
            { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
            i18n.status.rulesOnlyNote
          )
        : null;

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up' },
      createHeroCard({
        snapshot,
        categoryKey,
        categoryLabel,
        headlineText,
        aiNote,
        lastUpdatedAt,
        onRefresh
      }),
      createTimelineSection(air.hourly, hourly),
      createActionsSection(rules.actions || [])
    )
  );
}

export const renderDashboard = (container, props) => renderTodayView(container, props);
