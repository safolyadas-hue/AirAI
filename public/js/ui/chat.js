/**
 * CleanAir Assistant Conversational Chat UI View
 * Placeholder empty state until interactive chat wiring in Step 6.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Renders the Ask Assistant view empty state.
 * @param {HTMLElement} container
 */
export function renderChat(container) {
  clear(container);

  const header = h(
    'div',
    { className: 'card card-raised col-span-12' },
    h('h2', { id: 'chat-heading' }, i18n.chat.heading),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      i18n.chat.subheading
    )
  );

  const emptyCard = h(
    'div',
    { className: 'card col-span-12', style: { textAlign: 'center', padding: 'var(--space-8)' } },
    icon('chat', { size: 32 }),
    h(
      'h3',
      { style: { marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' } },
      i18n.chat.comingTitle
    ),
    h(
      'p',
      {
        style: {
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
          marginInline: 'auto'
        }
      },
      i18n.chat.comingBody
    )
  );

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'chat-heading' },
      header,
      emptyCard
    )
  );
}

export const renderChatView = renderChat;
