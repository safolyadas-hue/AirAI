# CleanAir Companion - Agent Rules & Architecture Guidelines

You are building "CleanAir Companion", a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. It suggests low-emission daily routines, indoor air quality hacks and sustainable alternatives tailored to the user's location and lifestyle, and clearly explains the direct impact of each choice.

These binding rules must be followed in every task:

## 1. Tech Stack

- **Frontend**: Vanilla JavaScript ES modules (no frameworks, no build step).
- **Static Hosting**: Served directly from `/public`.
- **Backend**: Netlify Functions (v2 API: `export default async (req, context) => Response`, with `export const config = { path: "/api/..." }`) located in `/netlify/functions`.
- **Runtime**: Node 20+.
- **Package Configuration**: `"type": "module"` in `package.json`.

## 2. Architecture & Separation of Concerns

- `/public/js/main.js`: Thin application bootstrap (<80 lines) wiring store, controller, and shell UI.
- `/public/js/app/`: Application controller (`controller.js`) — the only layer that orchestrates services, domain logic, and store.
- `/public/js/domain/`: Pure functions only. Zero DOM access, zero network access (`aqi.js`, `aqiBreakpoints.js`, `profile.js`, `rules.js`, `impact.js`, `impactFactors.js`, `hourly.js`).
- `/public/js/services/`: Network access and external communication (`api.js`).
- `/public/js/ui/`: DOM rendering and event listeners only (never imports `domain/` or `services/`):
  - `/public/js/ui/shell/`: `header.js`, `nav.js`, `banners.js`, `router.js`.
  - `/public/js/ui/today/`: `hero.js`, `pollutants.js`, `timeline.js`, `actions.js`, `index.js`.
  - `/public/js/ui/onboarding/`: `wizard.js`, `combobox.js`, `geolocation.js`, `stepLocation.js`, `stepHousehold.js`, `stepLifestyle.js`, `stepHomeBudget.js`, `index.js`.
- `/public/js/state/`: Reactive application store (`store.js`).
- `/netlify/functions/lib/`: Shared backend helper modules (HTTP, validation, rate limiting, Gemini AI, prompts, sanitize, types).

## 3. Code Standards & Constraints

- **JSDoc**: Every function must have clear JSDoc annotations with parameter and return types.
- **No Magic Numbers**: All constants must live in named config files (e.g., `/public/js/config.js`) with comments explaining their source and rationale.
- **Size Limits**: Maximum ~80 lines per function, maximum ~300 lines per file.
- **Security**: Never use `innerHTML` with dynamic user or external data; always use `textContent` or secure DOM helper utilities. Never expose secrets or API keys in client-side code.
- **Internationalization**: All user-facing strings must be routed through the single `/public/js/i18n/en.js` dictionary object.

## 4. Accessibility (a11y)

- Semantic HTML elements.
- Explicit form labels, ARIA attributes where necessary, and `focus-visible` styling.
- `aria-live` regions for dynamic updates and announcements.
- WCAG AA contrast compliance across all themes.
- Minimum 44x44px touch targets for interactive elements.
- Honor `prefers-reduced-motion` media queries in CSS animations.

## 5. Testing & Quality

- Every domain function and every Netlify function must have unit tests using Vitest.
- Vitest configured with `passWithNoTests: true`.
- Run checks (`npm run check`) to ensure ESLint and Vitest tests pass before committing.
- Endpoint smoke testing script (`npm run smoke`) validates all live or local Netlify dev endpoints against realistic scenarios and security guardrails.

## 6. Git & Asset Constraints

- Conventional commit messages (e.g., `feat:`, `fix:`, `chore:`, `test:`).
- Single branch workflow: `main` is the only branch.
- Repository size under 10 MB: no large raster images, fonts, or videos; use lightweight inline SVGs.
