/**
 * CleanAir Assistant Chat View Entry Point
 */
import { h, clear, mount } from '../dom.js';
import i18n from '../../i18n/en.js';
import { createMessageList } from './messageList.js';
import { createChatComposer } from './composer.js';

let draftText = '';

function createChatHeader(hasMessages, onClear) {
  return h(
    'div',
    {
      className: 'card card-raised col-span-12',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap'
      }
    },
    h(
      'div',
      {},
      h('h2', { id: 'chat-heading' }, i18n.chat.heading),
      h(
        'p',
        { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
        i18n.chat.subheading
      )
    ),
    hasMessages
      ? h(
          'button',
          {
            type: 'button',
            className: 'btn btn-secondary',
            onClick: () => {
              draftText = '';
              onClear();
            }
          },
          i18n.chat.clearButton
        )
      : null
  );
}

function createStarterChips(prompts, onSend) {
  if (!prompts?.length) return null;
  return h(
    'div',
    {
      className: 'col-span-12',
      style: { display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }
    },
    ...prompts.map((q) =>
      h(
        'button',
        {
          type: 'button',
          className: 'chip chip-accent',
          style: { cursor: 'pointer' },
          onClick: () => onSend(q)
        },
        q
      )
    )
  );
}

/**
 * Renders the CleanAir Assistant chat view.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 */
export function renderChat(
  container,
  {
    vm = null,
    onSend = async () => ({ ok: true }),
    onRetry = async () => ({ ok: true }),
    onClear = () => {}
  } = {}
) {
  clear(container);
  const stateVm = vm || {
    messages: [],
    status: 'idle',
    error: null,
    starterPrompts: [],
    maxChars: 500,
    showSafetyNote: true
  };
  const composer = createChatComposer({
    draftText,
    maxChars: stateVm.maxChars,
    isSending: stateVm.status === 'sending',
    onDraftChange: (v) => {
      draftText = v;
    },
    onSend: async (text) => {
      draftText = text;
      const res = await onSend(text);
      if (res?.ok) draftText = '';
    }
  });
  const safetyNote = stateVm.showSafetyNote
    ? h(
        'p',
        {
          className: 'col-span-12',
          style: {
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            textAlign: 'center'
          }
        },
        i18n.chat.safetyNote
      )
    : null;

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'chat-heading' },
      createChatHeader(stateVm.messages.length > 0, onClear),
      createMessageList({
        messages: stateVm.messages,
        status: stateVm.status,
        error: stateVm.error,
        onRetry
      }),
      createStarterChips(stateVm.starterPrompts, onSend),
      composer,
      safetyNote
    )
  );
}

export const renderChatView = renderChat;
