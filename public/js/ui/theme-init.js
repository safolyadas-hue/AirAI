/**
 * Early Theme & Font Initialization
 * Executed in <head> before first paint to prevent unstyled theme/font flash.
 * No inline scripts; safe for Content Security Policy.
 */
(function initThemeBeforePaint() {
  try {
    const theme = localStorage.getItem('cleanair_theme_pref');
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    }

    const font = localStorage.getItem('cleanair_font_size_pref');
    if (font === 'large') {
      document.documentElement.classList.add('font-large');
    } else if (font === 'larger') {
      document.documentElement.classList.add('font-larger');
    }
  } catch {
    // Graceful fallback if storage blocked
  }
})();
