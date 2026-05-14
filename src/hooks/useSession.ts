'use client'

import { useState, useRef, useCallback } from 'react'
import type { TranscriptTurn, DeepgramMetadata, ResistanceCurvePoint, SessionStatus } from '@/src/types/session'
import type { ScenarioKey, DifficultyKey } from '@/src/types/scenarios'
import { DIFFICULTIES } from '@/src/types/scenarios'

export interface SessionState {
  status: SessionStatus
  sessionId: string | null
  turns: TranscriptTurn[]
  interimText: string
  warmth: number
  resistanceCurve: ResistanceCurvePoint[]
  muted: boolean
  duration: number
  error: string | null
}

export function useSession(scenario: ScenarioKey, difficulty: DifficultyKey) {
  const [state, setState] = useState<SessionState>({
    status: 'idle',
    sessionId: null,
    turns: [],
    interimText: '',
    warmth: DIFFICULTIES[difficulty].resistanceStart as number,
    resistanceCurve: [],
    muted: false,
    duration: 0,
    error: null,
  })

  const sessionIdRef = useRef<string | null>(null)
  const turnsRef = useRef<TranscriptTurn[]>([])
  const warmthRef = useRef<number>(DIFFICULTIES[difficulty].resistanceStart)
  const resistanceCurveRef = useRef<ResistanceCurvePoint[]>([])
  const startTimeRef = useRef<number>(0)

  const update = useCallback((partial: Partial<SessionState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  const appendTurn = useCallback((turn: TranscriptTurn) => {
    turnsRef.current = [...turnsRef.current, turn]
    setState(prev => ({ ...prev, turns: turnsRef.current }))
  }, [])

  const updateWarmth = useCallback((newWarmth: number, event?: string) => {
    warmthRef.current = newWarmth
    const point: ResistanceCurvePoint = {
      turn: turnsRef.current.length,
      warmth: newWarmth,
      event,
    }
    resistanceCurveRef.current = [...resistanceCurveRef.current, point]
    setState(prev => ({
      ...prev,
      warmth: newWarmth,
      resistanceCurve: resistanceCurveRef.current,
    }))
  }, [])

  const getDeepgramMetadata = useCallback((): DeepgramMetadata => {
    const repTurns = turnsRef.current.filter(t => t.speaker === 'rep')
    const totalWords = repTurns.reduce((n, t) => n + t.text.split(' ').length, 0)
    const durationMins = (Date.now() - startTimeRef.current) / 60000
    const totalFillers = repTurns.reduce((n, t) => n + (t.fillerCount ?? 0), 0)

    return {
      wordsPerMinute: durationMins > 0 ? Math.round(totalWords / durationMins) : 0,
      longSilences: 0,
      fillerWords: totalFillers,
      avgConfidence: repTurns.length > 0
        ? repTurns.reduce((n, t) => n + (t.confidence ?? 0.9), 0) / repTurns.length
        : 0.9,
    }
  }, [])

  return {
    state,
    refs: { sessionIdRef, turnsRef, warmthRef, resistanceCurveRef, startTimeRef },
    update,
    appendTurn,
    updateWarmth,
    getDeepgramMetadata,
  }
}
