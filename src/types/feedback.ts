export interface DimensionScores {
  hook: number
  flow: number
  value_prop: number
  tone: number
  objections: number
  personalization: number
  cta: number
  filler_words: number
  pace: number
  silence_handling: number
  session_memory: number
  resistance_outcome: number
}

export interface ScoreComments {
  hook: string
  flow: string
  value_prop: string
  tone: string
  objections: string
  personalization: string
  cta: string
  filler_words: string
  pace: string
  silence_handling: string
  session_memory: string
  resistance_outcome: string
}

export interface QuoteHighlight {
  quote: string
  type: 'positive' | 'negative'
  dimension: keyof DimensionScores
  note: string
}

export interface TimelinePoint {
  turnIndex: number
  warmth: number
  event?: string
}

export interface FeedbackObject {
  scores: DimensionScores
  score_comments: ScoreComments
  overall_score: number
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  strengths: string[]
  improvements: string[]
  highlights: QuoteHighlight[]
  timeline: TimelinePoint[]
}

export const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  hook: 'Opening Hook',
  flow: 'Pitch Flow',
  value_prop: 'Value Proposition',
  tone: 'Tone',
  objections: 'Objection Handling',
  personalization: 'Personalization',
  cta: 'Call to Action',
  filler_words: 'Filler Words',
  pace: 'Speaking Pace',
  silence_handling: 'Silence Handling',
  session_memory: 'Session Memory',
  resistance_outcome: 'Resistance Outcome',
}
