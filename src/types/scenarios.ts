export const SCENARIOS = {
  english_enrollment: {
    label: 'English course enrollment',
    language: 'es' as const,
    prospectDescription:
      'Young professional in Guatemala City, interested in English for career advancement. Has limited time and is sensitive about cost.',
  },
  korean_course: {
    label: 'Korean course enrollment',
    language: 'es' as const,
    prospectDescription:
      'Student aged 18–24, curious about Korean culture and K-pop. Budget-conscious. Skeptical about whether the institute is qualified to teach Korean.',
  },
  portuguese_trial: {
    label: 'Portuguese free trial',
    language: 'es' as const,
    prospectDescription:
      'Business owner with Brazilian clients who needs basic Portuguese quickly. Very busy, time is the main objection.',
  },
  spanish_for_americans: {
    label: 'Spanish course (American student)',
    language: 'en' as const,
    prospectDescription:
      'American expat or tourist in Guatemala wanting conversational Spanish. Comparing IIA to apps like Duolingo. Main objection: why pay for classes?',
  },
} as const

export const DIFFICULTIES = {
  easy: {
    label: 'Easy',
    description: 'Warm prospect, open to hearing the pitch, minor objections only.',
    resistanceStart: 5,
  },
  skeptical: {
    label: 'Skeptical',
    description: 'Prospect starts doubtful and asks hard questions about quality and results.',
    resistanceStart: 3,
  },
  price_sensitive: {
    label: 'Price-sensitive',
    description: 'Prospect immediately raises price as the main blocker.',
    resistanceStart: 4,
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Prospect is impatient, interrupts, and challenges every claim.',
    resistanceStart: 2,
  },
} as const

export type ScenarioKey = keyof typeof SCENARIOS
export type DifficultyKey = keyof typeof DIFFICULTIES
export type Language = 'es' | 'en' | 'pt'
