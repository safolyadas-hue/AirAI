/**
 * English Dictionary (Single Source of Truth for User-Facing Strings)
 * Adheres strictly to AGENTS.md internationalization rule: no hardcoded UI strings.
 */
import { onboardingStrings } from './enOnboarding.js';

export const i18n = Object.freeze({
  app: {
    title: 'CleanAir Companion',
    tagline:
      'Personalized guidance for navigating smog, protecting indoor air, and reducing emissions.',
    skipToContent: 'Skip to main content'
  },
  nav: {
    label: 'Main Navigation',
    today: 'Today',
    todayShort: 'Today',
    plan: 'My Plan',
    planShort: 'Plan',
    indoor: 'Indoor Air',
    indoorShort: 'Indoor',
    swaps: 'Greener Swaps',
    swapsShort: 'Swaps',
    ask: 'Ask Assistant',
    askShort: 'Ask',
    impact: 'My Impact',
    impactShort: 'Impact'
  },
  header: {
    locationLabel: 'Location',
    editProfile: 'Edit profile',
    themeLabel: 'Toggle color scheme',
    fontSizeLabel: 'Adjust text size'
  },
  status: {
    offlineBanner:
      'You appear to be offline. Showing the latest loaded guidance until connection returns.',
    loadingAir: 'Fetching live air quality and weather forecast...',
    errorTitle: 'Could not load live air quality data',
    errorBody: 'Please check your connection and try again.',
    retryButton: 'Try again',
    refreshButton: 'Refresh air data',
    rulesOnlyNote: 'Showing smart rules-based guidance',
    aiLoading: 'Personalizing guidance for your household...',
    updatedJustNow: 'Updated just now',
    updatedMinutesAgo: 'Updated {min} min ago',
    updatedHoursAgo: 'Updated {hr} hr ago'
  },
  onboarding: onboardingStrings,
  aqiCategories: {
    good: 'Good',
    moderate: 'Moderate',
    unhealthySensitive: 'Unhealthy for Sensitive Groups',
    usg: 'Unhealthy for Sensitive Groups',
    unhealthy: 'Unhealthy',
    veryUnhealthy: 'Very Unhealthy',
    hazardous: 'Hazardous'
  },
  hero: {
    gaugeTitle: 'Current US AQI Reading',
    gaugeDesc: 'Circular dial visualizing current air pollution level and health status.',
    dominantPrefix: 'Main pollutant:',
    pollutants: {
      pm2_5: 'PM2.5',
      pm10: 'PM10',
      no2: 'NO₂',
      o3: 'O₃'
    },
    unitUgM3: 'µg/m³'
  },
  today: {
    heading: 'Today’s Air & Immediate Routines',
    riskBannerTitle: 'Today’s Air Quality Briefing',
    familyTitle: 'What this means for your family',
    stagnationTitle: 'Why smog is trapped today',
    stagnationMetrics: 'Wind: {wind} · Temp: {temp} · Humidity: {humidity}',
    safetyTitle: 'Severe Air Safety Alert',
    safetyBody:
      'Limit all outdoor exposure, wear a tight-fitting N95/FFP2 respirator if you must go outside, and consult a clinician if anyone experiences wheezing, chest tightness, or shortness of breath.',
    printButton: 'Print my family plan',
    printDisclaimer: 'Guidance only, not medical advice.',
    printIndoorEssentials:
      'Indoor Air Essentials: Seal window drafts, run HEPA or DIY box-fan filtration, and avoid indoor smoke.',
    timelineTitle: '24-Hour Air Quality & Ventilation Windows',
    timelineAriaLabel: '24-hour air quality forecast',
    timelineSubhead: 'Optimal times for outdoor errands, exercise, and window sealing.',
    bestWindowLabel: 'Cleanest Outdoor Window',
    worstWindowLabel: 'Peak Smog Window',
    windowSummary:
      'Cleanest window: {bestTime} (AQI {bestAqi}). Peak smog: {worstTime} (AQI {worstAqi}).',
    stagnationExplain: {
      low: 'Stagnation risk is low: winds are helping disperse pollutants.',
      moderate:
        'Stagnation risk is moderate: cooler or calmer hours may trap smog near ground level.',
      high: 'Stagnation risk is high: calm winds and cool humid air are trapping smog near breathing height.'
    },
    recommendedActionsTitle: 'Priority Protective Actions Right Now',
    noActionsAvailable: 'No high-priority alerts for this category.'
  },
  plan: {
    heading: 'Personalized Clean Air Plan',
    subheading:
      'Tailored daily protective routine based on your household, commute, and home profile.',
    progressLabel: '{done} of {total} actions done today',
    doneCheckboxLabel: 'Mark done',
    doneAnnounced: 'Marked "{title}" as done.',
    undoneAnnounced: 'Marked "{title}" as not done.',
    whyImpactTitle: 'Why this? Impact',
    estimatedPrefix: 'Estimated',
    pm25RangeLabel: 'Estimated PM2.5 exposure reduction: {min}–{max}%',
    co2WeeklyLabel: 'Estimated CO₂ avoided: {kg} kg/week',
    confidenceLabel: 'Confidence: {level}',
    aiSummaryTitle: 'Daily AI Narrative',
    periods: {
      morning: 'Morning',
      commute: 'Commute',
      midday: 'Midday',
      evening: 'Evening',
      night: 'Night',
      anytime: 'Anytime'
    },
    whyDisclosureTitle: 'Why this action matters',
    emptyText:
      'No actions apply right now. Adjust your profile or refresh air data to update your plan.'
  },
  indoor: {
    heading: 'Indoor Air Quality Hacks',
    subheading: 'Practical steps to keep indoor particulate levels low during smog episodes.',
    tiers: {
      free: 'Free',
      low: 'Low cost',
      invest: 'Worth investing in'
    },
    diyTitle: 'DIY Corsi-Rosenthal Box Filter',
    diySummary: '4 MERV-13 filters + 20" box fan + duct tape — high-CADR air cleaning at low cost.',
    diyMaterialsTitle: 'Materials',
    diyMaterials:
      'Four 20×20" MERV-13 furnace filters, one 20" box fan, cardboard base, and duct tape.',
    diySteps: [
      'Tape four MERV-13 filters into an open cube with airflow arrows pointing inward.',
      'Seal the bottom of the cube tightly to a square cardboard base.',
      'Place the box fan face-up on top of the cube so it pulls air through the filters.',
      'Tape all seams between the fan frame and filters so air cannot bypass.',
      'Add a cardboard shroud on the fan corners if needed and run on low or medium.'
    ],
    diyWhy:
      'Pulling room air through four large pleated filters delivers clean air at rates comparable to commercial HEPA units.',
    diySvgTitle: 'DIY Corsi-Rosenthal Box Filter Diagram',
    diySvgDesc: 'Four MERV-13 filters forming a cube with a box fan mounted on top.',
    ventTitle: 'Ventilation Timing',
    ventOpenMsg:
      'Best window to open windows: {time} (forecast US AQI {aqi}). Ventilate briefly for 15–20 minutes, then close.',
    ventClosedMsg:
      'Keep windows closed today: all forecast hours exceed US AQI 100 (best hour is {time} at AQI {aqi}).',
    safetyTitle: 'Cooking & Heating Safety',
    cookingNotes: {
      induction:
        'Induction cooking produces zero combustion NO₂; still run a range hood for cooking oil aerosols.',
      electric: 'Electric coils produce no combustion gas; use a lid and exhaust fan when frying.',
      lpg: 'LPG gas flames emit indoor NO₂ and ultrafine particles; run an exhaust hood and crack a kitchen window only during clean hours.',
      biomass:
        'Indoor biomass cooking emits heavy PM2.5 and CO; use an outdoor/vented cookspace or transition to induction/electric.'
    },
    heatingNotes: {
      electric: 'Electric heating adds zero indoor combustion particles.',
      gas: 'Ensure gas heaters are externally vented and inspect flues for carbon monoxide safety.',
      wood_biomass:
        'Wood heating releases dense black carbon indoors; switch to electric heating or warm layering during smog alerts.',
      coal: 'Coal heating creates severe indoor soot and toxic gases; halt indoor coal use and use electric warmth.',
      none: 'No indoor combustion heating detected; focus on sealing window and door drafts.'
    },
    checklistTitle: 'Room-by-Room Quick Checklist',
    checklistRooms: [
      { id: 'kitchen', label: 'Kitchen: Run exhaust hood while cooking and 10 min after' },
      { id: 'bedroom', label: 'Bedroom: Seal window gaps and run purifier on sleep mode' },
      { id: 'living', label: 'Living room: Damp-mop hard floors instead of dry sweeping' },
      { id: 'entrance', label: 'Entrance: Place a damp towel/mat at door sill to block drafts' }
    ],
    aiTipsTitle: 'More ideas for your home',
    emptyText: 'No indoor mitigation actions triggered for current conditions.'
  },
  swaps: {
    heading: 'Greener Urban Swaps',
    subheading: 'Small daily choices that reduce emissions while protecting your household.',
    areas: {
      commute: 'Commute',
      cooking: 'Cooking',
      heating: 'Heating',
      community: 'Community'
    },
    whatChangesPrefix: 'What changes for you:',
    communityTitle: 'Community Actions (If 100 Households Join)',
    communityItems: {
      'no-idling': {
        title: 'No-Idling Pledge',
        desc: 'Turn off vehicle engines when waiting more than 30 seconds.'
      },
      'report-burning': {
        title: 'Report Open Burning',
        desc: 'Report leaf, trash, or agricultural waste fires to local civic helplines.'
      },
      'tree-planting': {
        title: 'Urban Tree Planting',
        desc: 'Support native shade-tree planting along neighborhood streets and schools.'
      },
      carpooling: {
        title: 'Neighborhood Carpooling',
        desc: 'Share daily school and office commutes with nearby families.'
      }
    },
    aiSwapsTitle: 'Recommended Swaps',
    emptyText:
      'Your current commute and home energy setup is already low-emission. Explore community actions below.'
  },
  chat: {
    heading: 'CleanAir Assistant',
    subheading:
      'Ask questions about respiratory protection, DIY filters, smog science, or daily routines.',
    comingTitle: 'Coming in the next update',
    comingBody:
      'Interactive AI chat tailored to your live air quality and household profile will be available in Step 6.'
  },
  impact: {
    heading: 'Your Estimated Clean Air Impact',
    subheading:
      'Estimated emissions avoided and indoor exposure reduction based on your household profile.',
    comingTitle: 'Coming in the next update',
    comingBody: 'Personalized impact estimates and what-if comparisons will be available in Step 6.'
  },
  components: {
    whyThis: 'Why this choice matters',
    emptyTitle: 'Nothing to show yet',
    emptyText: 'We could not load information for this section. Please try again.',
    errorTitle: 'Unable to load content',
    retryButton: 'Try again'
  },
  toast: {
    themeUpdated: 'Appearance updated.',
    fontSizeUpdated: 'Text size updated.',
    viewChanged: 'View switched to ',
    profileSaved: 'Profile saved. Loading live air quality...',
    airRefreshed: 'Air quality data refreshed.'
  },
  footer: {
    attribution: 'Air quality measurements & meteorological forecasts powered by Open-Meteo.',
    medicalDisclaimer:
      'CleanAir Companion provides informational guidance based on WHO & EPA standards. It does not provide medical diagnosis or replace clinical advice.',
    repoLink: 'GitHub Project'
  }
});

export default i18n;
