import type { ScenarioKey, DifficultyKey, Language } from './scenarios'

export interface TranscriptTurn {
  speaker: 'rep' | 'prospect'
  text: string
  startMs: number
  endMs: number
  confidence?: number
  fillerCount?: number
}

export interface DeepgramMetadata {
  wordsPerMinute: number
  longSilences: number
  fillerWords: number
  avgConfidence: number
}

export interface ResistanceCurvePoint {
  turn: number
  warmth: number
  event?: string
}

export interface SessionConfig {
  scenario: ScenarioKey
  difficulty: DifficultyKey
  language: Language
  assignmentId?: string
}

export interface SessionTokens {
  sessionId: string
  deepgramApiKey: string
  elevenLabsApiKey: string
  voiceId: string
}

export type SessionStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'ended'
