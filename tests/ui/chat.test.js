/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../../public/js/state/store.js';
import { createController } from '../../public/js/app/controller.js';
import { ApiError } from '../../public/js/services/api.js';
import { formatAssistantText } from '../../public/js/ui/chat/formatText.js';
import { renderChat } from '../../public/js/ui/chat/index.js';

const PROFILE = {
  location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
  household: { adults: 2, children: 1, elderly: 0, pregnant: false, respiratoryCondition: false },
  commute: { mode: 'public_transit', distanceKm: 10 },
  home: {
    type: 'apartment',
    heating: 'electric',
    cooking: 'induction',
    hasPurifier: true,
    windowsSealed: false
  },
  budget: 'medium',
  exerciseOutdoors: false
};

describe('Chat Controller, Formatter & UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="a11y-announcements"></div><div id="mount"></div>';
    localStorage.clear();
  });

  it('controller handles success, 500-char limit, history cap at 10, 429 Retry-After, offline, fallback, and stale clear', async () => {
    const store = createStore({ profile: PROFILE, air: { airSnapshot: { aqi: 185 }, hourly: [] } });
    const sendChat = vi.fn(async () => ({ reply: 'Wear an N95.', fallback: false }));
    const ctrl = createController({
      store,
      api: { sendChat, getAirQuality: vi.fn(), getAdvice: vi.fn(), searchCity: vi.fn() }
    });

    // Reject empty and > 500 chars
    expect((await ctrl.sendChatMessage('   ')).ok).toBe(false);
    expect((await ctrl.sendChatMessage('a'.repeat(501))).ok).toBe(false);
    expect(sendChat).not.toHaveBeenCalled();

    // Seed 12 prior messages; history sent must be capped at 10
    const prior = Array.from({ length: 12 }, (_, i) => ({
      id: `m-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      text: `msg ${i}`
    }));
    store.set({ chat: { messages: prior, status: 'idle', error: null } });

    await ctrl.sendChatMessage('Hello');
    expect(sendChat.mock.calls[0][0].history).toHaveLength(10);
    expect(store.get().chat.messages.at(-1)?.text).toBe('Wear an N95.');

    // Fallback flag preserved on assistant message
    sendChat.mockResolvedValueOnce({ reply: 'Offline guidance text', fallback: true });
    await ctrl.sendChatMessage('Fallback check');
    expect(store.get().chat.messages.at(-1)?.isFallback).toBe(true);

    // 429 Retry-After
    sendChat.mockRejectedValueOnce(new ApiError('http', 'Too Many Requests', 429, 42));
    await ctrl.sendChatMessage('Rate limited');
    expect(store.get().chat.status).toBe('error');
    expect(store.get().chat.error?.message).toContain('42 seconds');

    // Network / offline error
    sendChat.mockRejectedValueOnce(new ApiError('network', 'Offline', null));
    await ctrl.sendChatMessage('Offline test');
    expect(store.get().chat.error?.message).toContain('offline');

    // Stale response ignored after clearChat()
    let resolveStale;
    sendChat.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolveStale = r;
        })
    );
    const pending = ctrl.sendChatMessage('Will clear');
    ctrl.clearChat();
    resolveStale({ reply: 'Stale reply', fallback: false });
    await pending;
    expect(store.get().chat.messages).toHaveLength(0);
  });

  it('formatAssistantText renders bold and bullets safely and treats HTML/scripts/links as inert text', () => {
    const frag = formatAssistantText(
      'Wear **N95**.\n\n- Seal **windows**\n- <script>alert(1)</script>\n- <img src=x onerror=alert(1)>\n- [link](javascript:alert(1))'
    );
    const wrap = document.createElement('div');
    wrap.appendChild(frag);

    expect(wrap.querySelectorAll('strong').length).toBe(2);
    expect(wrap.querySelectorAll('li').length).toBe(4);
    expect(wrap.querySelectorAll('script, img, a').length).toBe(0);
    expect(wrap.textContent).toContain('<script>alert(1)</script>');
    expect(wrap.textContent).toContain('[link](javascript:alert(1))');
  });

  it('Chat UI supports Enter to send, Shift+Enter newline, counter, role="log", and retry', async () => {
    const mountEl = document.getElementById('mount');
    const onSend = vi.fn(async () => ({ ok: true }));
    const onRetry = vi.fn(async () => ({ ok: true }));

    renderChat(mountEl, {
      vm: {
        messages: [{ id: '1', role: 'assistant', text: 'Offline tip', isFallback: true }],
        status: 'error',
        error: { message: 'You appear to be offline.', retryText: 'Retry me' },
        starterPrompts: ['What mask should I wear?'],
        maxChars: 500,
        showSafetyNote: true
      },
      onSend,
      onRetry,
      onClear: vi.fn()
    });

    expect(mountEl.querySelector('[role="log"]')).not.toBeNull();
    expect(mountEl.textContent).toContain('Offline guidance');

    const textarea = /** @type {HTMLTextAreaElement} */ (
      document.getElementById('chat-input-field')
    );
    textarea.value = 'Check AQI';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.getElementById('chat-char-counter')?.textContent).toBe('9 / 500');

    // Shift+Enter does not send
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true })
    );
    expect(onSend).not.toHaveBeenCalled();

    // Enter sends
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSend).toHaveBeenCalledWith('Check AQI');

    // Retry button triggers onRetry
    const retryBtn = Array.from(mountEl.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Retry')
    );
    retryBtn?.click();
    expect(onRetry).toHaveBeenCalled();
  });
});
