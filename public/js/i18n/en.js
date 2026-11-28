/**
 * English Dictionary (Single Source of Truth for User-Facing Strings)
 * Adheres strictly to AGENTS.md internationalization rule: no hardcoded UI strings.
 */
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
  onboarding: {
    heading: 'Set up your CleanAir profile',
    stepIndicator: 'Step {current} of {total}',
    quickStartLink: 'Quick start with location only',
    back: 'Back',
    next: 'Next',
    finish: 'Get my plan',
    cancel: 'Cancel',
    steps: {
      locationTitle: 'Where do you live?',
      locationSubtitle: 'We fetch local air quality and hourly wind forecasts for your area.',
      cityLabel: 'Search city or neighborhood',
      cityPlaceholder: 'Type at least 2 characters (e.g., Delhi, London)...',
      searching: 'Searching cities...',
      noResults: 'No matching locations found. Try a nearby major city.',
      searchError: 'Could not search locations right now. Please try again.',
      useMyLocation: 'Use my location',
      locating: 'Getting your location...',
      myLocationName: 'My location',
      geoUnsupported: 'Geolocation is not supported by your browser.',
      geoDenied: 'Location permission was denied. Please search for your city instead.',
      geoUnavailable: 'Your location is currently unavailable. Please search for your city.',
      geoTimeout: 'Location request timed out. Please try again or search by city.',
      locationRequired: 'Please select a city from the list or use your current location.',
      selectedLocation: 'Selected location:',

      householdTitle: 'Who is in your household?',
      householdSubtitle:
        'Air quality thresholds tighten when children, elders, or sensitive lungs are at home.',
      adultsLabel: 'Adults',
      childrenLabel: 'Children',
      elderlyLabel: 'Older adults (65+)',
      decrease: 'Decrease',
      increase: 'Increase',
      pregnantLabel: 'Someone in the household is pregnant',
      respiratoryLabel: 'Someone has asthma or a respiratory/heart condition',
      privacyNote: 'Stays on your device.',

      lifestyleTitle: 'Daily commute and home energy',
      lifestyleSubtitle: 'Helps tailor mask, route, and indoor emission recommendations.',
      commuteLegend: 'Primary commute mode',
      distanceLabel: 'Daily round-trip distance (km)',
      distanceError: 'Enter a distance between 0 and 300 km.',
      heatingLegend: 'Home heating source',
      cookingLegend: 'Primary cooking fuel',

      homeTitle: 'Home setup and budget',
      homeSubtitle: 'We only recommend air cleaning steps that fit your home and budget.',
      homeTypeLegend: 'Home type',
      windowsSealedLabel: 'Windows and door gaps are weather-sealed',
      hasPurifierLabel: 'We have a HEPA air purifier at home',
      exerciseOutdoorsLabel: 'Household members exercise outdoors',
      budgetLegend: 'Filter & gear budget'
    },
    options: {
      commute: {
        walk: 'Walk',
        cycle: 'Cycle',
        public_transit: 'Public transit',
        two_wheeler: 'Two-wheeler',
        car: 'Car',
        work_from_home: 'Work from home'
      },
      heating: {
        electric: 'Electric',
        gas: 'Gas',
        wood_biomass: 'Wood / biomass',
        coal: 'Coal',
        none: 'None'
      },
      cooking: {
        induction: 'Induction',
        electric: 'Electric',
        lpg: 'LPG / Gas',
        biomass: 'Biomass'
      },
      homeType: {
        apartment: 'Apartment',
        house: 'House'
      },
      budget: {
        low: 'Low',
        medium: 'Medium',
        high: 'High'
      }
    }
  },
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
    emptyText: 'Complete your profile to see your daily clean air schedule.'
  },
  indoor: {
    heading: 'Indoor Air Quality Hacks',
    subheading: 'Practical steps to keep indoor particulate levels low during smog episodes.',
    aiTipsTitle: 'Tailored Indoor Tips',
    emptyText: 'No indoor mitigation actions triggered for current conditions.'
  },
  swaps: {
    heading: 'Greener Urban Swaps',
    subheading: 'Small daily choices that reduce emissions while protecting your household.',
    aiSwapsTitle: 'Recommended Swaps',
    emptyText: 'No commute or home energy swaps triggered for current conditions.'
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
