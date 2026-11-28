/**
 * English Dictionary - Onboarding Wizard Strings
 */
export const onboardingStrings = Object.freeze({
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
});
