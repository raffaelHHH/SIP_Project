// All UI text. Keep each string short. Use {name} for values filled in by the app.
// To add a language, copy this file (e.g. ms.ts), translate the right-hand side,
// and register it in src/i18n/index.ts.
const en = {
  appName: 'Kaki Outdoors',
  langName: 'English',

  // Navigation
  navNearby: 'Nearby',
  navActivities: 'Activities',
  navSaved: 'Saved',
  navHelp: 'Help',
  back: 'Back',
  skip: 'Skip',
  next: 'Next',
  done: 'Done',

  // Onboarding
  obWelcome: 'Welcome!',
  obTagline: 'Find free outdoor places and easy games for your kids.',
  obChooseLang: 'Choose your language',
  obAgeQ: 'How old is your child?',
  obAgeHint: 'You can change this later',
  obLocationQ: 'Find places near you',
  obUseLocation: 'Use my location',
  obPickArea: 'Or choose your area',
  obLocating: 'Finding you…',
  obLocationDenied: 'No problem. Choose your area:',

  age_2_4: '2–4 years',
  age_5_8: '5–8 years',
  age_9_12: '9–12 years',

  // Location
  nearYou: 'Near you',
  changeArea: 'Change area',
  chooseArea: 'Choose your area',
  setAreaPrompt: 'Choose your area to see walking time',
  myLocation: 'My location',

  // Nearby
  listView: 'List',
  mapView: 'Map',
  iHave: 'I have',
  minShort: '{n} min',
  anyTime: 'Any',
  minWalk: '~{n} min walk',
  noSpots: 'No places match. Try fewer filters.',
  nothingClose: 'Nothing that close. Here are the nearest:',
  clearFilters: 'Clear filters',
  tryThese: 'Try these ({n} min)',
  sampleData: 'Sample data – please check on site',
  loadingMap: 'Loading map…',
  openSpot: 'Open',

  // Categories
  cat_playground: 'Playground',
  cat_park: 'Park',
  cat_garden: 'Garden',
  cat_library: 'Library',
  cat_cc: 'Community Club',
  cat_event: 'Events',

  // Features
  feat_sheltered: 'Sheltered',
  feat_toilet: 'Toilet',
  feat_lit: 'Lit at night',
  feat_awayFromRoad: 'Away from road',
  feat_fenced: 'Fenced play area',
  feat_water: 'Water point',
  feat_wheelchair: 'Wheelchair OK',

  // Spot detail
  hours: 'Opening hours',
  hours24h: 'Open 24 hours',
  checkOnSite: 'Check on site',
  goThere: 'Go there',
  save: 'Save',
  saved: 'Saved',
  thingsToDo: 'Things to do here',
  notFound: 'Not found',

  // Activities
  allAges: 'All ages',
  forMyChild: 'My child ({age})',
  needs: 'You need',
  needsNothing: 'Nothing!',
  develops: 'Helps with',
  steps: 'Steps',
  weDidThis: 'We did this!',
  doneToday: 'Done today ✓',
  greatJob: 'Great job! 🌱',
  doneTimes: 'Done {n}×',

  skill_motor: 'Moving',
  skill_thinking: 'Thinking',
  skill_nature: 'Nature',
  skill_social: 'Friends',
  skill_language: 'Words',

  // Saved & progress
  thisMonth: "You've done {n} outdoor activities this month 🌱",
  thisMonthZero: 'Ready for your first outdoor activity? 🌱',
  thisMonthOne: "You've done 1 outdoor activity this month 🌱",
  weekStreak: '{n} weeks in a row',
  badges: 'Badges',
  badgeSoon: 'Coming soon',
  badge_first: 'First step',
  badge_five: '5 activities',
  badge_nature: 'Nature friend',
  badge_rainbow: 'All-rounder',
  badge_ten: '10 activities',
  badge_explorer: 'Explorer',
  savedSpots: 'Saved places',
  savedActivities: 'Saved activities',
  nothingSaved: 'Tap ♡ to save',
  recentlyDone: 'What we did',

  // Help
  howToUse: 'How to use',
  how1: 'Find a place',
  how2: 'Pick an activity',
  how3: 'Tap "We did this!"',
  freeResources: 'Free help nearby',
  settings: 'Settings',
  language: 'Language',
  childAge: 'Child age',
  area: 'Area',
  feedback: 'Tell us what you think',
  feedbackComment: 'Comment (optional)',
  send: 'Send',
  thanks: 'Thank you! 🙏',
  rating1: 'Very bad',
  rating2: 'Bad',
  rating3: 'OK',
  rating4: 'Good',
  rating5: 'Very good',
  version: 'Version {v}',

  // Team stats (for the project team, not parents)
  teamStats: 'Team stats',
  statSpotViews: 'Places viewed',
  statGoThere: '"Go there" taps',
  statActivitiesDone: 'Activities done',
  statDays: 'Days app opened',
  statReturnVisits: 'Return visits',
  statOpens: 'Total app opens',
  statFeedback: 'Feedback entries',
  statFirstUsed: 'First used',
  exportStats: 'Export stats (CSV)',
  exportFeedbackCsv: 'Export feedback (CSV)',
  exportFeedbackJson: 'Export feedback (JSON)',
  resetAll: 'Reset all data on this phone',
  resetConfirm: 'Delete all saved data on this phone?',

  // Weather tips
  tipRain: 'Rain expected – try a sheltered place',
  tipHot: 'Hot afternoon – try a shady place',
  tipEvening: 'Getting dark – pick a place lit at night',
  tipMorning: 'Cool morning – great time for the park!',
  tipNice: 'Nice weather for playing outside!',
  showSheltered: 'Show',
};

export default en;
export type Strings = { [K in keyof typeof en]: string };
