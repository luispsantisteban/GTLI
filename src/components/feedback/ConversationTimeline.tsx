'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { getWarmthColor } from '@/src/lib/utils'
import type { TimelinePoint } from '@/src/types/feedback'

interface ConversationTimelineProps {
  timeline: TimelinePoint[]
  onSeek?: (turnIndex: number) => void
}

export function ConversationTimeline({ timeline, onSeek }: ConversationTimelineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!timeline.length) return null

  return (
    <Card>
      <CardHeader><CardTitle>Conversation Timeline</CardTitle></CardHeader>
      <div className="relative h-12 flex rounded-lg overflow-hidden">
        {timeline.map((point, i) => {
          const width = `${100 / timeline.length}%`
          return (
            <div
              key={i}
              className="relative h-full cursor-pointer transition-opacity hover:opacity-80"
              style={{ width, backgroundColor: getWarmthColor(point.warmth) }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSeek?.(point.turnIndex)}
            />
          )
        })}
      </div>

      {hoveredIdx !== null && timeline[hoveredIdx] && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <span className="font-semibold">Turn {timeline[hoveredIdx].turnIndex + 1}</span>
          {' · '}Warmth: {timeline[hoveredIdx].warmth}/10
          {timeline[hoveredIdx].event && ` · ${timeline[hoveredIdx].event}`}
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>Start</span>
        <div className="flex items-center gap-4">
          {[
            { color: '#ef4444', label: 'Cold' },
            { color: '#eab308', label: 'Neutral' },
            { color: '#22c55e', label: 'Warm' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <span>End</span>
      </div>
    </Card>
  )
}
