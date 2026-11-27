/**
 * English Dictionary (Single Source of Truth for User-Facing Strings)
 * Adheres strictly to AGENTS.md internationalization rule: no hardcoded UI strings.
 */
export const i18n = Object.freeze({
  app: {
    title: 'CleanAir Companion',
    tagline:
      'Personalized guidance for navigating smog, protecting indoor air, and reducing emissions.',
    skipToContent: 'Skip to main content',
    demoBadge: 'DEMO PREVIEW'
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
    demoCity: 'New Delhi (NCR)',
    themeLabel: 'Toggle color scheme',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
    themeSystem: 'System theme',
    fontSizeLabel: 'Adjust text size',
    fontNormal: 'Standard text size',
    fontLarge: 'Large text size',
    fontLarger: 'Extra large text size'
  },
  demo: {
    controlLabel: 'Demo: preview air quality levels',
    legend: 'Demo AQI Level:',
    good: 'Good (35)',
    moderate: 'Moderate (78)',
    usg: 'USG (132)',
    unhealthy: 'Unhealthy (185)',
    veryUnhealthy: 'Very Unhealthy (245)',
    hazardous: 'Hazardous (340)'
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
    updatedJustNow: 'Updated 4 mins ago',
    hazeLabel: 'Smog inversion haze layer',
    safeNotice: 'Conditions are safe for all outdoor activity.',
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
    stagnationLabel: 'Inversion Stagnation Risk',
    recommendedActionsTitle: 'Priority Protective Actions Right Now',
    noActionsAvailable: 'No high-priority alerts for this category.'
  },
  plan: {
    heading: 'Personalized Clean Air Plan',
    subheading:
      'Tailored daily protective routine based on your household, commute, and home profile.',
    profileSummaryTitle: 'Household Exposure Profile',
    routineTitle: 'Structured Daily Schedule',
    morning: 'Morning Routine (6:00 - 9:00 AM)',
    commute: 'Commute Protection (9:00 - 11:00 AM)',
    midday: 'Midday Indoor Defense (12:00 - 4:00 PM)',
    evening: 'Evening Kitchen & Home (5:00 - 8:00 PM)',
    night: 'Overnight Recovery (9:00 PM - 6:00 AM)',
    whyDisclosureTitle: 'Why this action matters'
  },
  indoor: {
    heading: 'Indoor Air Quality Hacks',
    subheading: 'Low-cost, highly effective techniques to keep particulate levels low indoors.',
    purifierStatusTitle: 'Air Cleaning & Filtration',
    ventilationTitle: 'Smart Ventilation Timing',
    cookingTitle: 'Kitchen Emission Controls',
    sealingTitle: 'Thermal Leak & Gap Sealing',
    effortLabel: 'Effort',
    costLabel: 'Cost Tier',
    freeCost: 'Free / Zero Cost',
    lowCost: 'Low Cost (< $15)'
  },
  swaps: {
    heading: 'Greener Urban Swaps',
    subheading:
      'Small daily choices that reduce your personal emissions footprint while protecting lungs.',
    commuteSwapsTitle: 'Clean Transit Alternatives',
    heatingCookingTitle: 'Clean Heating & Cooking',
    communityTitle: 'Neighborhood Action',
    estimatedAvoidance: 'Emissions Avoided'
  },
  chat: {
    heading: 'CleanAir Assistant',
    subheading:
      'Ask questions about respiratory protection, DIY filters, smog science, or daily routines.',
    inputPlaceholder: 'Ask about masks, air filters, or ventilation timing...',
    sendButton: 'Send message',
    suggestedHeading: 'Suggested queries:',
    suggested1: 'What mask should I wear when AQI is over 150?',
    suggested2: 'How do I build a DIY Corsi-Rosenthal box filter?',
    suggested3: 'Is it safe to exercise outdoors this morning?',
    disclaimer: 'Guidance only. Not medical advice. For persistent symptoms, consult a doctor.'
  },
  impact: {
    heading: 'Your Estimated Clean Air Impact',
    subheading:
      'Estimated emissions avoided and indoor exposure reduction based on typical household factors.',
    co2SavedTitle: 'Estimated CO₂ Avoided per Week',
    co2Metric: 'Estimated kg CO₂e / week',
    indoorReductionTitle: 'Estimated Indoor PM2.5 Reduction',
    indoorReductionRange: '30–50%',
    indoorMetric: 'Estimated reduction range',
    assumptionsTitle: 'Estimates & Assumptions',
    assumptionsBody:
      'Weekly CO₂ estimates use DEFRA urban transit conversion factors for a 10 km daily round trip. Indoor PM2.5 ranges reflect sealed-window + HEPA filtration studies and vary by room volume and air leakage.',
    calculatorTitle: 'Emissions What-If Calculator (Coming Soon)',
    calculatorBody:
      'Compare commute modes, home heating, and filtration scenarios interactively once live location profiles are connected.'
  },
  components: {
    whyThis: 'Why this choice matters',
    emptyTitle: 'No data currently available',
    emptyText: 'We could not load information for this section. Please try again.',
    errorTitle: 'Unable to load content',
    retryButton: 'Try again',
    close: 'Close',
    expand: 'Expand details'
  },
  toast: {
    themeUpdated: 'Appearance updated.',
    fontSizeUpdated: 'Text size updated.',
    viewChanged: 'View switched to ',
    demoAqiSwitched: 'Demo AQI switched to '
  },
  footer: {
    attribution: 'Air quality measurements & meteorological forecasts powered by Open-Meteo.',
    medicalDisclaimer:
      'CleanAir Companion provides informational guidance based on WHO & EPA standards. It does not provide medical diagnosis or replace clinical advice.',
    repoLink: 'GitHub Project'
  }
});

export default i18n;
