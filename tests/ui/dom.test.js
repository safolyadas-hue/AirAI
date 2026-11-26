/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { h, clear, mount } from '../../public/js/ui/dom.js';

describe('Safe DOM Builder (h)', () => {
  it('creates elements with textContent and classes safely', () => {
    const el = h('div', { className: 'card active' }, 'Safe Content');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toBe('card active');
    expect(el.textContent).toBe('Safe Content');
  });

  it('renders script tags and onerror strings as inert text without HTML injection', () => {
    const maliciousPayload1 = '<script>alert("xss")</script>';
    const maliciousPayload2 = '<img src="x" onerror="alert(1)">';

    const el = h('div', { id: 'test-injection' }, maliciousPayload1, maliciousPayload2);

    expect(el.innerHTML).not.toContain('<script>');
    expect(el.querySelectorAll('script').length).toBe(0);
    expect(el.querySelectorAll('img').length).toBe(0);
    expect(el.textContent).toContain('<script>alert("xss")</script>');
    expect(el.textContent).toContain('<img src="x" onerror="alert(1)">');
  });

  it('sets dataset attributes correctly', () => {
    const el = h('button', { dataset: { tabId: 'today', actionKey: 'refresh' } });
    expect(el.dataset.tabId).toBe('today');
    expect(el.dataset.actionKey).toBe('refresh');
  });

  it('attaches event listeners securely via onClick or on object', () => {
    const clickSpy = vi.fn();
    const btn = h('button', { onClick: clickSpy }, 'Click Me');
    btn.click();
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const keySpy = vi.fn();
    const input = h('input', { on: { keydown: keySpy } });
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(keySpy).toHaveBeenCalledTimes(1);
  });

  it('clears all children from an element safely', () => {
    const parent = h('div', {}, h('span', {}, 'Child 1'), h('span', {}, 'Child 2'));
    expect(parent.children.length).toBe(2);
    clear(parent);
    expect(parent.children.length).toBe(0);
    expect(parent.textContent).toBe('');
  });

  it('mounts children safely into an existing parent', () => {
    const container = document.createElement('div');
    const child = h('p', {}, 'Mounted text');
    mount(container, child);
    expect(container.contains(child)).toBe(true);
  });
});
