/**
 * Onboarding - Browser Geolocation Helper
 * Requests geolocation only when triggered by user click.
 */
import i18n from '../../i18n/en.js';

/**
 * Requests current browser position and maps errors to clear i18n messages.
 * @param {{ onSuccess: (loc: { name: string, lat: number, lon: number }) => void, onError: (msg: string) => void }} callbacks
 */
export function requestBrowserLocation({ onSuccess, onError }) {
  const s = i18n.onboarding.steps;
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError(s.geoUnsupported);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      onSuccess({
        name: s.myLocationName,
        lat: Number(pos.coords.latitude.toFixed(2)),
        lon: Number(pos.coords.longitude.toFixed(2))
      });
    },
    (err) => {
      if (err.code === 1) onError(s.geoDenied);
      else if (err.code === 3) onError(s.geoTimeout);
      else onError(s.geoUnavailable);
    },
    { timeout: 10000 }
  );
}
