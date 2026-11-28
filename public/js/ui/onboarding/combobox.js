/**
 * Onboarding - ARIA Combobox Controller for City Search
 */
import { CACHE_CONFIG } from '../../config.js';
import { h, clear } from '../dom.js';
import i18n from '../../i18n/en.js';

function renderListboxDom({ isOpen, results, activeIndex, statusText, onSelect }) {
  const box = document.getElementById('location-listbox');
  const input = /** @type {HTMLInputElement | null} */ (document.getElementById('city-combobox'));
  const statusEl = document.getElementById('location-search-status');
  if (statusEl) statusEl.textContent = statusText;
  if (!box || !input) return;

  clear(box);
  const open = isOpen && results.length > 0;
  input.setAttribute('aria-expanded', open ? 'true' : 'false');
  input.setAttribute(
    'aria-activedescendant',
    open && activeIndex >= 0 ? `loc-opt-${activeIndex}` : ''
  );
  box.hidden = !open;
  if (!open) return;

  results.forEach((item, idx) => {
    box.appendChild(
      h(
        'li',
        {
          id: `loc-opt-${idx}`,
          role: 'option',
          className: 'combobox-option',
          'aria-selected': idx === activeIndex ? 'true' : 'false',
          onMouseDown: (e) => {
            e.preventDefault();
            onSelect(item);
          }
        },
        item.label || item.name
      )
    );
  });
}

function handleComboboxKeyDown(e, state, choose, syncListbox) {
  const len = state.results.length;
  if (e.key === 'ArrowDown' && len > 0) {
    e.preventDefault();
    state.isOpen = true;
    state.activeIndex = (state.activeIndex + 1) % len;
  } else if (e.key === 'ArrowUp' && len > 0) {
    e.preventDefault();
    state.isOpen = true;
    state.activeIndex = (state.activeIndex - 1 + len) % len;
  } else if (
    e.key === 'Enter' &&
    state.isOpen &&
    state.activeIndex >= 0 &&
    state.results[state.activeIndex]
  ) {
    e.preventDefault();
    choose(state.results[state.activeIndex]);
    return;
  } else if (e.key === 'Escape') {
    state.isOpen = false;
    state.activeIndex = -1;
  } else {
    return;
  }
  syncListbox();
}

function buildComboboxElements(state, locationError, onInput, onKeyDown) {
  const input = h('input', {
    id: 'city-combobox',
    className: 'form-input',
    type: 'text',
    role: 'combobox',
    autocomplete: 'off',
    value: state.query,
    placeholder: i18n.onboarding.steps.cityPlaceholder,
    'aria-autocomplete': 'list',
    'aria-expanded': state.isOpen && state.results.length > 0 ? 'true' : 'false',
    'aria-controls': 'location-listbox',
    'aria-activedescendant':
      state.isOpen && state.activeIndex >= 0 ? `loc-opt-${state.activeIndex}` : '',
    'aria-invalid': locationError ? 'true' : 'false',
    'aria-describedby': locationError ? 'location-error-msg' : undefined,
    onInput,
    onKeyDown
  });
  const statusEl = h(
    'div',
    {
      id: 'location-search-status',
      role: 'status',
      'aria-live': 'polite',
      style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }
    },
    state.statusText
  );
  const listbox = h('ul', {
    id: 'location-listbox',
    role: 'listbox',
    className: 'combobox-listbox',
    hidden: !(state.isOpen && state.results.length > 0)
  });
  return { input, statusEl, listbox };
}

/**
 * Creates stateful ARIA combobox handlers and DOM elements.
 * @param {{ initialQuery: string, onSearchCity: (q: string) => Promise<Array<any>>, onSelect: (item: any) => void }} opts
 */
export function createCityCombobox({ initialQuery, onSearchCity, onSelect }) {
  const state = {
    query: initialQuery || '',
    results: [],
    statusText: '',
    isOpen: false,
    activeIndex: -1
  };
  let searchSeq = 0;
  let debounceTimer = null;

  const choose = (item) => {
    state.query = item.label || item.name;
    state.isOpen = false;
    state.activeIndex = -1;
    onSelect(item);
  };
  const syncListbox = () => renderListboxDom({ ...state, onSelect: choose });

  const runSearch = async (q) => {
    const s = i18n.onboarding.steps;
    const seq = ++searchSeq;
    state.statusText = s.searching;
    state.isOpen = true;
    syncListbox();
    try {
      const list = await onSearchCity(q);
      if (seq !== searchSeq) return;
      state.results = Array.isArray(list) ? list : [];
      state.activeIndex = state.results.length > 0 ? 0 : -1;
      state.statusText = state.results.length === 0 ? s.noResults : '';
      state.isOpen = true;
    } catch {
      if (seq !== searchSeq) return;
      state.results = [];
      state.activeIndex = -1;
      state.statusText = s.searchError;
      state.isOpen = false;
    }
    syncListbox();
  };

  const handleInput = (e) => {
    const val = /** @type {HTMLInputElement} */ (e.target).value;
    state.query = val;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (val.trim().length < CACHE_CONFIG.SEARCH_MIN_CHARS) {
      state.results = [];
      state.isOpen = false;
      state.statusText = '';
      syncListbox();
      return;
    }
    debounceTimer = setTimeout(() => runSearch(val.trim()), CACHE_CONFIG.SEARCH_DEBOUNCE_MS);
  };

  return {
    renderElements: (err) =>
      buildComboboxElements(state, err, handleInput, (e) =>
        handleComboboxKeyDown(e, state, choose, syncListbox)
      ),
    syncListbox,
    setQuery: (q) => {
      state.query = q;
    }
  };
}
