'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScenarioSelector } from '@/src/components/session/ScenarioSelector'
import { Button } from '@/src/components/ui/Button'
import { Card } from '@/src/components/ui/Card'
import type { ScenarioKey, DifficultyKey } from '@/src/types/scenarios'
import { SCENARIOS } from '@/src/types/scenarios'

function NewSessionContent() {
  const router = useRouter()
  const params = useSearchParams()

  const [scenario, setScenario] = useState<ScenarioKey | ''>(
    (params.get('scenario') as ScenarioKey) || ''
  )
  const [difficulty, setDifficulty] = useState<DifficultyKey | ''>(
    (params.get('difficulty') as DifficultyKey) || ''
  )
  const assignmentId = params.get('assignmentId')

  const canStart = scenario !== '' && difficulty !== ''

  function handleStart() {
    const query = new URLSearchParams({
      scenario,
      difficulty,
      ...(assignmentId ? { assignmentId } : {}),
    })
    router.push(`/session/live?${query}`)
  }

  const selectedScenario = scenario ? SCENARIOS[scenario] : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Practice Session</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a scenario and difficulty to begin your sales pitch practice.
        </p>
      </div>

      <Card>
        <ScenarioSelector
          scenario={scenario}
          difficulty={difficulty}
          onScenarioChange={setScenario}
          onDifficultyChange={setDifficulty}
        />
      </Card>

      {selectedScenario && difficulty && (
        <Card className="bg-indigo-50 border-indigo-200">
          <p className="text-sm font-medium text-indigo-800 mb-1">Ready to practice:</p>
          <p className="text-sm text-indigo-700">{selectedScenario.prospectDescription}</p>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="lg" disabled={!canStart} onClick={handleStart}>
          Start Session
        </Button>
      </div>
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <NewSessionContent />
    </Suspense>
  )
}
