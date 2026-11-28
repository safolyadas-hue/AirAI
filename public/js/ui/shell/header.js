/**
 * App Shell - Sticky Header with Brand, Single Location Pill, Edit Profile, Font & Theme Controls
 */
import i18n from '../../i18n/en.js';
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { cycleTheme, cycleFontSize } from '../a11y.js';
import { showToast } from '../toast.js';

/**
 * Builds the application header and returns update handle for dynamic location/edit button.
 * @param {{ onEditProfile: () => void }} props
 * @returns {{ el: HTMLElement, syncHeader: (opts: { profile: any, showOnboarding: boolean }) => void }}
 */
export function createHeader({ onEditProfile }) {
  const locationText = h('span', { className: 'header-location-text' }, '');
  const locationChip = h(
    'span',
    { className: 'chip header-location', title: i18n.header.locationLabel, hidden: true },
    icon('location', { size: 14 }),
    locationText
  );

  const editProfileBtn = h(
    'button',
    { type: 'button', className: 'btn btn-secondary', hidden: true, onClick: onEditProfile },
    i18n.header.editProfile
  );

  const themeBtn = h(
    'button',
    {
      className: 'btn btn-icon btn-ghost',
      'aria-label': i18n.header.themeLabel,
      title: i18n.header.themeLabel,
      onClick: () => {
        const next = cycleTheme();
        showToast(`${i18n.toast.themeUpdated} (${next})`, { type: 'info', duration: 2500 });
      }
    },
    icon('sun', { size: 20 })
  );

  const fontBtn = h(
    'button',
    {
      className: 'btn btn-icon btn-ghost',
      'aria-label': i18n.header.fontSizeLabel,
      title: i18n.header.fontSizeLabel,
      onClick: () => {
        const next = cycleFontSize();
        showToast(`${i18n.toast.fontSizeUpdated} (${next})`, { type: 'info', duration: 2500 });
      }
    },
    h('span', { style: { fontWeight: '700', fontSize: '0.9rem' } }, 'A±')
  );

  const el = h(
    'header',
    { className: 'app-header', role: 'banner' },
    h(
      'div',
      { className: 'header-container container' },
      h(
        'div',
        { className: 'brand-group' },
        icon('leaf', { size: 32, className: 'brand-logo' }),
        h(
          'div',
          { className: 'brand-text-wrap' },
          h('h1', { className: 'brand-title' }, i18n.app.title)
        )
      ),
      locationChip,
      h('div', { className: 'header-actions' }, editProfileBtn, fontBtn, themeBtn)
    )
  );

  const syncHeader = ({ profile, showOnboarding }) => {
    locationChip.hidden = !profile;
    editProfileBtn.hidden = showOnboarding || !profile;
    if (profile) locationText.textContent = profile.location.name;
  };

  return { el, syncHeader };
}
