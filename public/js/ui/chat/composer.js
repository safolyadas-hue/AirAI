/**
 * Chat Composer Component
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { announce } from '../a11y.js';
import i18n from '../../i18n/en.js';

function handleComposerInput(val, state, maxChars, isSending, counterEl, sendBtn, onDraftChange) {
  onDraftChange(val);
  const len = val.length;
  counterEl.textContent = i18n.chat.counterFormat
    .replace('{count}', String(len))
    .replace('{max}', String(maxChars));
  sendBtn.disabled = isSending || !val.trim() || val.trim().length > maxChars;
  if (len >= maxChars - 50 && !state.announced) {
    state.announced = true;
    announce(
      i18n.chat.approachingLimit.replace('{remaining}', String(Math.max(0, maxChars - len)))
    );
  } else if (len < maxChars - 50) {
    state.announced = false;
  }
}

/**
 * Creates the chat input form.
 * @param {{ draftText: string, maxChars: number, isSending: boolean, onDraftChange: (v: string) => void, onSend: (text: string) => void }} opts
 * @returns {HTMLElement}
 */
export function createChatComposer({ draftText, maxChars, isSending, onDraftChange, onSend }) {
  const limitState = { announced: false };
  const counterEl = h(
    'span',
    {
      id: 'chat-char-counter',
      style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }
    },
    i18n.chat.counterFormat
      .replace('{count}', String(draftText.length))
      .replace('{max}', String(maxChars))
  );

  const sendBtn = h(
    'button',
    {
      type: 'submit',
      className: 'btn btn-primary',
      disabled: isSending || !draftText.trim() || draftText.trim().length > maxChars
    },
    icon('chat', { size: 16 }),
    i18n.chat.sendButton
  );

  const textarea = h('textarea', {
    id: 'chat-input-field',
    className: 'form-input',
    rows: '2',
    value: draftText,
    placeholder: i18n.chat.inputPlaceholder,
    'aria-describedby': 'chat-char-counter',
    style: { width: '100%', resize: 'vertical' },
    onInput: (e) =>
      handleComposerInput(
        /** @type {HTMLTextAreaElement} */ (e.target).value,
        limitState,
        maxChars,
        isSending,
        counterEl,
        sendBtn,
        onDraftChange
      ),
    onKeyDown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = /** @type {HTMLTextAreaElement} */ (e.target).value.trim();
        if (!isSending && val && val.length <= maxChars) onSend(val);
      }
    }
  });
  /** @type {HTMLTextAreaElement} */ (textarea).value = draftText;

  return h(
    'form',
    {
      className: 'card col-span-12',
      style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
      onSubmit: (e) => {
        e.preventDefault();
        const val = /** @type {HTMLTextAreaElement} */ (textarea).value.trim();
        if (!isSending && val && val.length <= maxChars) onSend(val);
      }
    },
    h('label', { className: 'form-label', for: 'chat-input-field' }, i18n.chat.inputLabel),
    textarea,
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)'
        }
      },
      counterEl,
      sendBtn
    )
  );
}
