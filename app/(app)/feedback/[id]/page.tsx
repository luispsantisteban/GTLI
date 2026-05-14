'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ScoreCard } from '@/src/components/feedback/ScoreCard'
import { QuoteHighlights } from '@/src/components/feedback/QuoteHighlights'
import { ConversationTimeline } from '@/src/components/feedback/ConversationTimeline'
import { VoiceSignals } from '@/src/components/feedback/VoiceSignals'
import { Spinner } from '@/src/components/ui/Spinner'
import { Button } from '@/src/components/ui/Button'
import type { FeedbackObject } from '@/src/types/feedback'
import type { DeepgramMetadata } from '@/src/types/session'
import Link from 'next/link'

export default function FeedbackPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const [feedback, setFeedback] = useState<FeedbackObject | null>(null)
  const [progress, setProgress] = useState('Generating feedback…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const es = new EventSource(`/api/feedback/generate`)
    // Use fetch+SSE since we need a POST
    generateFeedback()
  }, [sessionId])

  async function generateFeedback() {
    try {
      const res = await fetch('/api/feedback/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'progress') setProgress(data.message)
          if (data.type === 'complete') setFeedback(data.feedback)
          if (data.type === 'error') setError(data.message)
        }
      }
    } catch (err) {
      setError(String(err))
    }
  }

  const mockMetadata: DeepgramMetadata = {
    wordsPerMinute: feedback ? 135 : 0,
    longSilences: 1,
    fillerWords: feedback?.scores.filler_words ? Math.max(0, (10 - feedback.scores.filler_words) * 2) : 0,
    avgConfidence: 0.93,
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <Spinner size="lg" />
        <p className="text-gray-600 text-sm">{progress}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Session Feedback</h1>
        <div className="flex gap-2">
          <Link href={`/coach/${sessionId}`}>
            <Button variant="secondary" size="sm">Ask Coach</Button>
          </Link>
          <Link href="/session/new">
            <Button size="sm">Practice Again</Button>
          </Link>
        </div>
      </div>

      <ScoreCard feedback={feedback} />
      <ConversationTimeline timeline={feedback.timeline} />
      <QuoteHighlights highlights={feedback.highlights} />
      <VoiceSignals metadata={mockMetadata} />
    </div>
  )
}
