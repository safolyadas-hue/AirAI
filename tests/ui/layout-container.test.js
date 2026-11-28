/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initApp } from '../../public/js/main.js';
import { updateTimelineFade } from '../../public/js/ui/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAYOUT_CSS = fs.readFileSync(path.resolve(__dirname, '../../public/css/layout.css'), 'utf8');

describe('Layout Container, Sticky Footer & Mobile Header', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app-root" class="app-wrapper"></div>';
    localStorage.clear();
    initApp();
  });

  it('shares the .container class across header inner, main, and footer inner', () => {
    const headerInner = document.querySelector('header.app-header .header-container');
    const main = document.querySelector('main#main-content');
    const footerInner = document.querySelector('footer.app-footer .footer-inner');

    expect(headerInner?.classList.contains('container')).toBe(true);
    expect(main?.classList.contains('container')).toBe(true);
    expect(main?.classList.contains('app-main')).toBe(true);
    expect(footerInner?.classList.contains('container')).toBe(true);
  });

  it('ensures app wrapper and main carry sticky-footer flex classes and CSS rules', () => {
    const root = document.getElementById('app-root');
    const main = document.getElementById('main-content');

    expect(root?.classList.contains('app-wrapper')).toBe(true);
    expect(main?.classList.contains('app-main')).toBe(true);

    expect(LAYOUT_CSS).toMatch(/\.container\s*\{[^}]*max-width:\s*var\(--content-max-width\)/s);
    expect(LAYOUT_CSS).toMatch(/\.container\s*\{[^}]*margin-inline:\s*auto/s);
    expect(LAYOUT_CSS).toMatch(
      /\.container\s*\{[^}]*padding-inline:\s*var\(--container-padding-inline\)/s
    );
    expect(LAYOUT_CSS).toMatch(/\.app-wrapper\s*\{[^}]*min-height:\s*100dvh/s);
    expect(LAYOUT_CSS).toMatch(/\.app-main\s*\{[^}]*flex:\s*1/s);
  });

  it('renders the location pill only once in the header', () => {
    const locationPills = document.querySelectorAll('header.app-header .header-location');
    expect(locationPills.length).toBe(1);
  });

  it('toggles timeline overflow fade classes based on scroll position', () => {
    const strip = document.createElement('div');
    Object.defineProperty(strip, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(strip, 'scrollWidth', { value: 800, configurable: true });

    // At scroll start: only right fade
    strip.scrollLeft = 0;
    updateTimelineFade(strip);
    expect(strip.classList.contains('has-overflow-left')).toBe(false);
    expect(strip.classList.contains('has-overflow-right')).toBe(true);

    // Mid-scroll: both fades
    strip.scrollLeft = 100;
    updateTimelineFade(strip);
    expect(strip.classList.contains('has-overflow-left')).toBe(true);
    expect(strip.classList.contains('has-overflow-right')).toBe(true);

    // At scroll end: only left fade
    strip.scrollLeft = 500;
    updateTimelineFade(strip);
    expect(strip.classList.contains('has-overflow-left')).toBe(true);
    expect(strip.classList.contains('has-overflow-right')).toBe(false);
  });
});
