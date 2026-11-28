/**
 * Chat Message List Component
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';
import { formatAssistantText } from './formatText.js';

function createBubble(msg) {
  const isAssistant = msg.role === 'assistant';
  const body = isAssistant
    ? formatAssistantText(msg.text)
    : h('p', { style: { fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-wrap' } }, msg.text);

  return h(
    'div',
    {
      className: `card ${isAssistant ? 'card-tinted' : 'card-raised'}`,
      style: {
        marginBottom: 'var(--space-3)',
        borderLeft: isAssistant ? '4px solid var(--accent-text)' : '1px solid var(--color-border)',
        maxWidth: '88%',
        alignSelf: isAssistant ? 'flex-start' : 'flex-end',
        marginLeft: isAssistant ? '0' : 'auto'
      }
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-1)',
          flexWrap: 'wrap'
        }
      },
      icon(isAssistant ? 'shield' : 'chat', { size: 15 }),
      h(
        'strong',
        {
          style: {
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }
        },
        isAssistant ? i18n.chat.assistantLabel : i18n.chat.userLabel
      ),
      isAssistant && msg.isFallback
        ? h('span', { className: 'badge badge-effort-medium' }, i18n.chat.offlineBadge)
        : null
    ),
    body
  );
}

function createEmptyCard() {
  return h(
    'div',
    { className: 'card', style: { textAlign: 'center', padding: 'var(--space-6)' } },
    icon('chat', { size: 28 }),
    h(
      'h3',
      { style: { marginTop: 'var(--space-2)', marginBottom: 'var(--space-1)' } },
      i18n.chat.emptyTitle
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
      i18n.chat.emptyBody
    )
  );
}

/**
 * Builds the message log container and auto-scrolls only when near bottom.
 * @param {{ messages: Array<any>, status: string, error: any, onRetry: () => void }} opts
 * @returns {HTMLElement}
 */
export function createMessageList({ messages, status, error, onRetry }) {
  const logChildren = messages.length === 0 ? [createEmptyCard()] : messages.map(createBubble);

  if (status === 'sending') {
    logChildren.push(
      h(
        'div',
        {
          className: 'card card-tinted',
          role: 'status',
          'aria-live': 'polite',
          style: { maxWidth: '70%' }
        },
        h(
          'span',
          { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
          i18n.chat.typingLabel
        )
      )
    );
  }
  if (status === 'error' && error) {
    logChildren.push(
      h(
        'div',
        {
          className: 'safety-banner',
          role: 'alert',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            flexWrap: 'wrap'
          }
        },
        h('span', { style: { fontSize: 'var(--font-size-sm)' } }, error.message),
        h(
          'button',
          { type: 'button', className: 'btn btn-secondary', onClick: onRetry },
          icon('refresh', { size: 14 }),
          i18n.chat.retryButton
        )
      )
    );
  }

  const logEl = h(
    'div',
    {
      id: 'chat-log',
      className: 'col-span-12',
      role: 'log',
      'aria-live': 'polite',
      'aria-relevant': 'additions',
      'aria-label': i18n.chat.logLabel,
      style: { display: 'flex', flexDirection: 'column', maxHeight: '460px', overflowY: 'auto' }
    },
    ...logChildren
  );
  if (logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 80)
    logEl.scrollTop = logEl.scrollHeight;
  return logEl;
}
