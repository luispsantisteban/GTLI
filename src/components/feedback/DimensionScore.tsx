import { cn } from '@/src/lib/utils'
import { DIMENSION_LABELS } from '@/src/types/feedback'
import type { DimensionScores } from '@/src/types/feedback'

interface DimensionScoreProps {
  dimension: keyof DimensionScores
  score: number
  comment?: string
}

export function DimensionScore({ dimension, score, comment }: DimensionScoreProps) {
  const pct = score * 10
  const color = score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{DIMENSION_LABELS[dimension]}</span>
        <span className={cn('font-bold', score >= 7 ? 'text-green-600' : score >= 5 ? 'text-yellow-600' : 'text-red-600')}>
          {score}/10
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      {comment && <p className="text-xs text-gray-500 leading-relaxed">{comment}</p>}
    </div>
  )
}
