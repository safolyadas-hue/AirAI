/**
 * English Dictionary - Chat & Impact What-If Strings
 */
export const chatStrings = Object.freeze({
  heading: 'CleanAir Assistant',
  subheading:
    'Ask questions about respiratory protection, DIY filters, smog science, or daily routines.',
  logLabel: 'Conversation with CleanAir Assistant',
  emptyTitle: 'Ask about today’s air quality',
  emptyBody: 'Choose a starter question below or type your own question (up to 500 characters).',
  userLabel: 'You',
  assistantLabel: 'CleanAir Assistant',
  offlineBadge: 'Offline guidance',
  typingLabel: 'Assistant is typing',
  clearButton: 'Clear conversation',
  retryButton: 'Retry',
  inputLabel: 'Ask a question',
  inputPlaceholder: 'Ask about masks, air filters, or ventilation timing...',
  sendButton: 'Send',
  counterFormat: '{count} / {max}',
  approachingLimit: '{remaining} characters remaining.',
  safetyNote:
    'AI guidance, not medical advice. For breathing difficulty or chest pain, seek emergency care.',
  starters: {
    kidsOutside: 'Is it safe for my kids to play outside today?',
    cheapestClean: 'Cheapest way to clean my bedroom air?',
    purifierOvernight: 'Should I run my purifier overnight?',
    woodAlternative: 'What can I use instead of burning wood for heat?',
    genericMask: 'What mask should I wear at today’s AQI?',
    genericVentilation: 'When is the safest time to open windows today?'
  }
});

export const impactStrings = Object.freeze({
  heading: 'Your Estimated Clean Air Impact',
  subheading:
    'Toggle actions below to see how your household choices combine to cut indoor PM2.5 and weekly CO₂.',
  emptyTitle: 'Impact model waiting for air data',
  emptyBody:
    'Complete your profile and load live air quality data to explore your personalized what-if impact.',
  togglesTitle: 'What-If Action Toggles',
  areas: {
    protection: 'Personal Protection',
    home: 'Indoor Air & Home',
    commute: 'Commute & Swaps'
  },
  pm25TileTitle: 'Estimated indoor PM2.5 exposure reduction',
  co2TileTitle: 'Estimated CO₂ avoided per week',
  countTileTitle: 'Selected actions',
  estimatedLabel: 'Estimated',
  chartTitle: 'Before & After Indoor PM2.5',
  chartBadge: 'Illustrative estimate',
  chartWithoutLabel: 'Without changes',
  chartWithLabel: 'With selected actions',
  chartWhoLabel: 'WHO 24h guideline (15 µg/m³)',
  chartTableToggle: 'View as table',
  communityTitle: 'If {count} households in your area did this',
  communityWeekly: 'Estimated {kg} kg CO₂/week avoided',
  communityYearly: 'Estimated {kg} kg CO₂/year avoided',
  assumptionsTitle: 'Estimates and assumptions',
  assumptionsNote:
    'Real results vary with home air leakage, outdoor pollution swings, filter fit, and daily behavior.'
});
