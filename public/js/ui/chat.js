/**
 * CleanAir Assistant Conversational Chat UI View
 * Scoped strictly to scientific air navigation, indoor hacks, and respiratory guidance.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Creates a message bubble element safely.
 * @param {'user' | 'assistant'} sender
 * @param {string} text
 * @returns {HTMLElement}
 */
function createMessageBubble(sender, text) {
  const isAssistant = sender === 'assistant';
  return h(
    'div',
    {
      className: `card col-span-12 ${isAssistant ? 'card-tinted' : 'card-raised'}`,
      style: {
        marginBottom: 'var(--space-3)',
        borderLeft: isAssistant ? '4px solid var(--color-accent)' : '1px solid var(--color-border)',
        maxWidth: '85%',
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
          marginBottom: 'var(--space-1)'
        }
      },
      icon(isAssistant ? 'shield' : 'chat', { size: 16 }),
      h(
        'strong',
        {
          style: {
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        },
        isAssistant ? i18n.app.title : 'You'
      )
    ),
    h('p', { style: { fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-line' } }, text)
  );
}

/**
 * Renders the interactive CleanAir Assistant chat view.
 * @param {HTMLElement} container
 * @param {Array<{ sender: 'user' | 'assistant', text: string }>} [messages=[]]
 * @param {(text: string) => void} [onSendMessage=()=>{}]
 */
export function renderChat(container, messages = [], onSendMessage = () => {}) {
  clear(container);

  const defaultMessages =
    messages.length > 0
      ? messages
      : [
          {
            sender: 'assistant',
            text: 'Hello! I am your CleanAir Companion. Ask me about certified N95 masks, DIY Corsi-Rosenthal box filters, ventilation windows, or low-emission routines.'
          },
          {
            sender: 'user',
            text: 'What mask should I wear when outdoor AQI is 185?'
          },
          {
            sender: 'assistant',
            text: 'When AQI is 185 (Unhealthy), wear a certified N95 or FFP2 respirator. Standard cloth and surgical masks leak up to 70% of fine PM2.5 particulates around the edges, whereas a well-fitted N95 provides an electrostatic seal blocking 95% of fine particles.'
          }
        ];

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

  const messageStream = h(
    'div',
    {
      className: 'col-span-12',
      role: 'log',
      'aria-live': 'polite',
      style: { display: 'flex', flexDirection: 'column' }
    },
    ...defaultMessages.map((m) =>
      createMessageBubble(/** @type {'user'|'assistant'} */ (m.sender), m.text)
    )
  );

  // Suggestion queries
  const suggestions = [i18n.chat.suggested1, i18n.chat.suggested2, i18n.chat.suggested3];
  const suggestionPills = h(
    'div',
    {
      className: 'col-span-12',
      style: {
        display: 'flex',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        margin: 'var(--space-2) 0'
      }
    },
    h(
      'span',
      {
        style: {
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          alignSelf: 'center'
        }
      },
      i18n.chat.suggestedHeading
    ),
    ...suggestions.map((q) =>
      h(
        'button',
        {
          type: 'button',
          className: 'chip chip-accent',
          style: { cursor: 'pointer', textAlign: 'left' },
          onClick: () => {
            const inputEl = /** @type {HTMLInputElement | null} */ (
              document.getElementById('chat-input-field')
            );
            if (inputEl) {
              inputEl.value = q;
              inputEl.focus();
            }
          }
        },
        q
      )
    )
  );

  // Input form
  const input = h('input', {
    id: 'chat-input-field',
    className: 'form-input',
    type: 'text',
    placeholder: i18n.chat.inputPlaceholder,
    'aria-label': i18n.chat.inputPlaceholder,
    style: { flex: 1 }
  });

  const sendBtn = h(
    'button',
    { className: 'btn btn-primary', type: 'submit' },
    icon('chat', { size: 16 }),
    i18n.chat.sendButton
  );

  const form = h(
    'form',
    {
      className: 'col-span-12 card',
      style: { display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3)' },
      onSubmit: (e) => {
        e.preventDefault();
        const val = /** @type {HTMLInputElement} */ (input).value.trim();
        if (val) {
          onSendMessage(val);
          /** @type {HTMLInputElement} */ (input).value = '';
        }
      }
    },
    input,
    sendBtn
  );

  const disclaimer = h(
    'p',
    {
      className: 'col-span-12',
      style: { fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }
    },
    i18n.chat.disclaimer
  );

  const view = h(
    'div',
    { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'chat-heading' },
    header,
    messageStream,
    suggestionPills,
    form,
    disclaimer
  );

  mount(container, view);
}

// Backward compatibility helper
export const renderChatView = renderChat;
