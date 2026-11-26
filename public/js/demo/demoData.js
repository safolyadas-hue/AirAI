/**
 * TEMPORARY DEMO DATA (REMOVE IN STEP 5)
 * Provides realistic domain data across all 6 AQI levels to validate the design system and app shell without network calls.
 */

export const DEMO_DATA_BY_CATEGORY = Object.freeze({
  good: {
    aqi: 35,
    pm2_5: 8.5,
    pm10: 16.0,
    dominantPollutant: 'pm2_5',
    headline: 'Clean Air Window: Optimal for Outdoor Workouts & Home Aeration',
    riskLevel: 'low',
    vulnerableHousehold: false,
    actions: [
      {
        id: 'aeration-window',
        title: 'Open Windows for Cross-Ventilation',
        category: 'indoor',
        timeOfDay: 'midday',
        effort: 'low',
        costTier: 'free',
        priority: 1,
        why: 'Ambient particulate matter is safely below WHO guidelines. Natural ventilation purges stale indoor CO2 and moisture.'
      },
      {
        id: 'outdoor-exercise',
        title: 'Enjoy Outdoor Sports and Running',
        category: 'routine',
        timeOfDay: 'morning',
        effort: 'low',
        costTier: 'free',
        priority: 2,
        why: 'Zero respiratory restriction is needed today; excellent pulmonary benefit from outdoor cardiovascular workouts.'
      },
      {
        id: 'cycle-errands',
        title: 'Walk or Cycle for Daily Commuting',
        category: 'swap',
        timeOfDay: 'commute',
        effort: 'low',
        costTier: 'free',
        priority: 3,
        why: 'Active commuting keeps urban air clean while burning zero fossil fuels.'
      }
    ]
  },
  moderate: {
    aqi: 78,
    pm2_5: 25.0,
    pm10: 65.0,
    dominantPollutant: 'pm2_5',
    headline: 'Acceptable Air: Precautionary Care for Sensitive Household Members',
    riskLevel: 'elevated',
    vulnerableHousehold: true,
    actions: [
      {
        id: 'shift-exercise-window',
        title: 'Shift Aerobic Exercise to Afternoon Winds',
        category: 'routine',
        timeOfDay: 'midday',
        effort: 'low',
        costTier: 'free',
        priority: 1,
        why: 'Morning temperature inversions trap localized emissions. Winds pick up after 11:00 AM, improving ground dispersion.'
      },
      {
        id: 'smart-ventilation',
        title: 'Ventilate Briefly with Kitchen Exhaust Active',
        category: 'indoor',
        timeOfDay: 'evening',
        effort: 'low',
        costTier: 'free',
        priority: 2,
        why: 'Ventilate for 15 minutes during peak breeze, then seal windows to retain clean air.'
      },
      {
        id: 'wet-mop',
        title: 'Damp Mop Living Spaces',
        category: 'indoor',
        timeOfDay: 'morning',
        effort: 'low',
        costTier: 'free',
        priority: 3,
        why: 'Captures coarse particles before they are resuspended into the indoor breathing zone.'
      }
    ]
  },
  usg: {
    aqi: 132,
    pm2_5: 48.0,
    pm10: 120.0,
    dominantPollutant: 'pm2_5',
    headline: 'Smog Advisory: Sensitive Groups Must Minimize Strenuous Exertion',
    riskLevel: 'elevated',
    vulnerableHousehold: true,
    actions: [
      {
        id: 'indoor-gym',
        title: 'Move High-Intensity Cardio Indoors',
        category: 'routine',
        timeOfDay: 'morning',
        effort: 'medium',
        costTier: 'free',
        priority: 1,
        why: 'At AQI 132, elevated minute ventilation during outdoor exercise dramatically increases deep lung particulate deposition.'
      },
      {
        id: 'hepa-medium',
        title: 'Run HEPA Air Cleaner on Medium Speed',
        category: 'indoor',
        timeOfDay: 'anytime',
        effort: 'low',
        costTier: 'low',
        priority: 2,
        why: 'Maintains 3 to 4 air changes per hour in sensitive family members’ bedrooms.'
      },
      {
        id: 'metro-transit',
        title: 'Take Enclosed Metro Instead of Two-Wheeler',
        category: 'swap',
        timeOfDay: 'commute',
        effort: 'medium',
        costTier: 'low',
        priority: 3,
        why: 'Open motorized two-wheeler travel in peak traffic causes acute exposure to direct diesel soot.'
      }
    ]
  },
  unhealthy: {
    aqi: 185,
    pm2_5: 110.0,
    pm10: 210.0,
    dominantPollutant: 'pm2_5',
    headline: 'High Smog Warning: Wear N95 Respirator Outdoors & Seal Indoors',
    riskLevel: 'high',
    vulnerableHousehold: true,
    actions: [
      {
        id: 'n95-protection',
        title: 'Wear Certified N95/FFP2 Respirator in Traffic',
        category: 'protection',
        timeOfDay: 'commute',
        effort: 'low',
        costTier: 'low',
        priority: 1,
        why: 'Certified N95 respirators filter out 95% of fine toxic particles. Standard cloth or surgical masks leak heavily around the nose and cheeks.'
      },
      {
        id: 'seal-windows',
        title: 'Seal Drafty Window Seams & Doors',
        category: 'indoor',
        timeOfDay: 'morning',
        effort: 'low',
        costTier: 'free',
        priority: 2,
        why: 'Using rolled towels or foam tape blocks up to 50% of ambient winter smog infiltration.'
      },
      {
        id: 'no-incense',
        title: 'Extinguish Incense, Candles & Unvented Flames',
        category: 'indoor',
        timeOfDay: 'evening',
        effort: 'low',
        costTier: 'free',
        priority: 3,
        why: 'Burning indoor incense generates concentrated ultrafine particles and volatile aromatics inside a closed room.'
      }
    ]
  },
  very_unhealthy: {
    aqi: 245,
    pm2_5: 195.0,
    pm10: 340.0,
    dominantPollutant: 'pm2_5',
    headline: 'Severe Pollution Alert: Avoid All Outdoor Workouts & Filter Indoor Air',
    riskLevel: 'severe',
    vulnerableHousehold: true,
    actions: [
      {
        id: 'cancel-outdoor',
        title: 'Cancel Outdoor Sports & Children’s Play',
        category: 'routine',
        timeOfDay: 'anytime',
        effort: 'low',
        costTier: 'free',
        priority: 1,
        why: 'Severe particulate levels cause acute airway irritation and vascular oxidative stress in children and elders.'
      },
      {
        id: 'max-hepa',
        title: 'Operate True HEPA Filtration on High',
        category: 'indoor',
        timeOfDay: 'anytime',
        effort: 'low',
        costTier: 'medium',
        priority: 2,
        why: 'Maintains a clean air sanctuary indoors while outdoor air is heavily compromised.'
      },
      {
        id: 'work-from-home',
        title: 'Work From Home if Schedule Allows',
        category: 'swap',
        timeOfDay: 'commute',
        effort: 'medium',
        costTier: 'free',
        priority: 3,
        why: 'Eliminates peak traffic exhaust exposure and reduces overall city vehicular emissions.'
      }
    ]
  },
  hazardous: {
    aqi: 340,
    pm2_5: 290.0,
    pm10: 480.0,
    dominantPollutant: 'pm2_5',
    headline: 'Hazardous Air Emergency: Complete Seal & Maximum Indoor Filtration',
    riskLevel: 'severe',
    vulnerableHousehold: true,
    actions: [
      {
        id: 'emergency-seal',
        title: 'Keep All Windows & Vents Firmly Sealed',
        category: 'indoor',
        timeOfDay: 'anytime',
        effort: 'low',
        costTier: 'free',
        priority: 1,
        why: 'Emergency inversion conditions: outdoor air poses an immediate respiratory hazard for the entire population.'
      },
      {
        id: 'diy-box-fan',
        title: 'Run DIY Corsi-Rosenthal Box / Dual Purifiers',
        category: 'indoor',
        timeOfDay: 'anytime',
        effort: 'medium',
        costTier: 'low',
        priority: 2,
        why: 'High-CADR filtration removes heavy particulate loads rapidly across large communal living zones.'
      },
      {
        id: 'strict-n95',
        title: 'Strict N95/FFP3 for Any Essential Movement',
        category: 'protection',
        timeOfDay: 'anytime',
        effort: 'low',
        costTier: 'low',
        priority: 3,
        why: 'Unprotected outdoor breathing during hazardous smog triggers severe bronchial inflammation.'
      }
    ]
  }
});

/**
 * 24-hour demo timeline forecast points.
 */
export const DEMO_TIMELINE_HOURLY = Object.freeze([
  { time: '06:00', aqi: 220, isWorst: true },
  { time: '08:00', aqi: 195 },
  { time: '10:00', aqi: 170 },
  { time: '12:00', aqi: 140 },
  { time: '14:00', aqi: 110, isBest: true },
  { time: '16:00', aqi: 135 },
  { time: '18:00', aqi: 180 },
  { time: '20:00', aqi: 210 },
  { time: '22:00', aqi: 225 },
  { time: '00:00', aqi: 230 },
  { time: '02:00', aqi: 215 },
  { time: '04:00', aqi: 210 }
]);
