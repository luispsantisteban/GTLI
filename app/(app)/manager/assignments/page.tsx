'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Button } from '@/src/components/ui/Button'
import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'

export default function AssignmentsPage() {
  const [repId, setRepId] = useState('')
  const [scenario, setScenario] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [minScore, setMinScore] = useState(70)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function createAssignment() {
    setLoading(true)
    try {
      await fetch('/api/assignments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repId, scenario, difficulty, minScore }),
      })
      setSuccess(true)
      setRepId('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>

      <Card>
        <CardHeader><CardTitle>Create Assignment</CardTitle></CardHeader>
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 mb-4">
            Assignment created successfully.
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rep User ID</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={repId}
              onChange={e => setRepId(e.target.value)}
              placeholder="UUID of the rep"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              value={scenario}
              onChange={e => setScenario(e.target.value)}
            >
              <option value="">Select scenario</option>
              {Object.entries(SCENARIOS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
            >
              <option value="">Select difficulty</option>
              {Object.entries(DIFFICULTIES).map(([key, d]) => (
                <option key={key} value={key}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Score (0–100): {minScore}
            </label>
            <input
              type="range" min={0} max={100} value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <Button
            onClick={createAssignment}
            loading={loading}
            disabled={!repId || !scenario || !difficulty}
            className="w-full"
          >
            Create Assignment
          </Button>
        </div>
      </Card>
    </div>
  )
}
