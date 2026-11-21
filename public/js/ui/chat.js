/**
 * CleanAir Companion GenAI Chat UI Component
 * DOM rendering only.
 */
import { createElement, clearElement } from './dom.js';
import i18n from '../i18n/en.js';

/**
 * Renders the interactive AI chat dialog.
 * @param {HTMLElement} container
 * @param {Array<{ sender: 'user' | 'assistant', text: string }>} messages
 * @param {(messageText: string) => void} onSendMessage
 */
export function renderChat(container, messages = [], onSendMessage) {
  clearElement(container);

  const section = createElement('section', {
    classes: ['card', 'chat-section'],
    attributes: { 'aria-labelledby': 'chat-heading' }
  });

  const heading = createElement('h2', {
    attributes: { id: 'chat-heading' },
    text: i18n.chat.title
  });
  section.appendChild(heading);

  const messageList = createElement('div', {
    classes: ['chat-messages'],
    attributes: { 'aria-live': 'polite', role: 'log' }
  });

  messages.forEach((msg) => {
    const bubble = createElement('div', {
      classes: ['chat-bubble', `chat-${msg.sender}`],
      text: msg.text
    });
    messageList.appendChild(bubble);
  });
  section.appendChild(messageList);

  const inputForm = createElement('form', { classes: ['chat-form'] });
  const input = createElement('input', {
    classes: ['input'],
    attributes: {
      type: 'text',
      placeholder: i18n.chat.inputPlaceholder,
      'aria-label': i18n.chat.inputPlaceholder
    }
  });

  const sendBtn = createElement('button', {
    classes: ['btn'],
    attributes: { type: 'submit' },
    text: i18n.chat.sendButton
  });

  inputForm.appendChild(input);
  inputForm.appendChild(sendBtn);

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = /** @type {HTMLInputElement} */ (input).value.trim();
    if (text) {
      onSendMessage(text);
      /** @type {HTMLInputElement} */ (input).value = '';
    }
  });

  section.appendChild(inputForm);
  container.appendChild(section);
}
