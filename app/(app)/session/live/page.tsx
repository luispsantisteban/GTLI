'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useVoiceSession } from '@/src/hooks/useVoiceSession'
import { WaveformVisualizer } from '@/src/components/session/WaveformVisualizer'
import { LiveTranscript } from '@/src/components/session/LiveTranscript'
import { SessionControls } from '@/src/components/session/SessionControls'
import { Card } from '@/src/components/ui/Card'
import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'
import type { ScenarioKey, DifficultyKey } from '@/src/types/scenarios'
import { useEffect, useRef, useState } from 'react'

function LiveSessionContent() {
  const params = useSearchParams()
  const router = useRouter()

  const scenario = (params.get('scenario') as ScenarioKey) ?? 'english_enrollment'
  const difficulty = (params.get('difficulty') as DifficultyKey) ?? 'easy'

  const { state, analyser, startSession, endSession, toggleMute } = useVoiceSession(scenario, difficulty)
  const [localAnalyser, setLocalAnalyser] = useState<AnalyserNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    if (analyser && analyser !== analyserRef.current) {
      analyserRef.current = analyser
      setLocalAnalyser(analyser)
    }
  }, [analyser])

  if (!params.get('scenario')) {
    router.replace('/session/new')
    return null
  }

  const scenarioInfo = SCENARIOS[scenario]
  const difficultyInfo = DIFFICULTIES[difficulty]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{scenarioInfo.label}</h1>
          <p className="text-sm text-gray-500">{difficultyInfo.label} difficulty</p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>Language: <span className="font-medium uppercase">{scenarioInfo.language}</span></p>
        </div>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <WaveformVisualizer status={state.status} analyserNode={localAnalyser} />

      <Card padding={false}>
        <div className="p-4">
          <LiveTranscript turns={state.turns} interimText={state.interimText} />
        </div>
      </Card>

      <SessionControls
        status={state.status}
        muted={state.muted}
        warmth={state.warmth}
        duration={state.duration}
        onStart={startSession}
        onEnd={endSession}
        onToggleMute={toggleMute}
      />

      {state.status === 'idle' && (
        <p className="text-center text-xs text-gray-400">
          Click <strong>Start Session</strong> to begin. Microphone access is required.
        </p>
      )}
    </div>
  )
}

export default function LiveSessionPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading session…</div>}>
      <LiveSessionContent />
    </Suspense>
  )
}
