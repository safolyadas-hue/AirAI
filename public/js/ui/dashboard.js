/**
 * Air Quality Dashboard UI Component
 * DOM rendering only.
 */
import { createElement, clearElement } from './dom.js';
import { getAqiCategory, getAqiColor } from '../domain/aqi.js';
import i18n from '../i18n/en.js';

/**
 * Renders the primary dashboard view.
 * @param {HTMLElement} container - Target container.
 * @param {object} props - Dashboard data.
 * @param {number | null} props.aqi - Current AQI value.
 * @param {number | null} props.pm25 - Current PM2.5 reading.
 * @param {Array<{ time: string, aqi: number, pm25: number }>} props.hourly - Forecast.
 */
export function renderDashboard(container, { aqi, pm25, hourly = [] }) {
  clearElement(container);

  const section = createElement('section', {
    classes: ['card', 'dashboard-section'],
    attributes: { 'aria-labelledby': 'dashboard-heading' }
  });

  const heading = createElement('h2', {
    attributes: { id: 'dashboard-heading' },
    text: i18n.dashboard.currentAqi
  });
  section.appendChild(heading);

  if (typeof aqi !== 'number') {
    const emptyNotice = createElement('p', { text: i18n.dashboard.noData });
    section.appendChild(emptyNotice);
    container.appendChild(section);
    return;
  }

  const categoryKey = getAqiCategory(aqi);
  const color = getAqiColor(aqi);

  const aqiBadge = createElement('div', {
    classes: ['aqi-display'],
    attributes: { style: `border-left: 6px solid ${color}; padding-left: 1rem; margin: 1rem 0;` },
    children: [
      createElement('span', {
        classes: ['badge'],
        text: i18n.aqiCategories[categoryKey] || categoryKey
      }),
      createElement('p', {
        classes: ['aqi-value'],
        attributes: { style: 'font-size: 2.5rem; font-weight: bold;' },
        text: String(aqi)
      }),
      createElement('p', {
        classes: ['pm25-value'],
        text: `${i18n.dashboard.pm25Label}: ${pm25 ?? 'N/A'} µg/m³`
      })
    ]
  });
  section.appendChild(aqiBadge);

  if (hourly.length > 0) {
    const forecastTitle = createElement('h3', { text: i18n.dashboard.forecast });
    const forecastList = createElement('ul', {
      classes: ['forecast-list'],
      attributes: { style: 'display: flex; gap: 0.5rem; list-style: none; overflow-x: auto;' }
    });

    hourly.slice(0, 6).forEach((item) => {
      const itemEl = createElement('li', {
        classes: ['card'],
        children: [
          createElement('span', { text: item.time }),
          createElement('strong', { text: ` AQI ${item.aqi}` })
        ]
      });
      forecastList.appendChild(itemEl);
    });

    section.appendChild(forecastTitle);
    section.appendChild(forecastList);
  }

  container.appendChild(section);
}
