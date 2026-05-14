import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { DIMENSION_LABELS } from '@/src/types/feedback'
import type { QuoteHighlight } from '@/src/types/feedback'
import { cn } from '@/src/lib/utils'

interface QuoteHighlightsProps {
  highlights: QuoteHighlight[]
}

export function QuoteHighlights({ highlights }: QuoteHighlightsProps) {
  if (!highlights.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Moments</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {highlights.map((h, i) => (
          <div
            key={i}
            className={cn(
              'rounded-lg p-4 border-l-4',
              h.type === 'positive'
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-400'
            )}
          >
            <blockquote className="text-sm font-medium text-gray-800 mb-2">
              "{h.quote}"
            </blockquote>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{DIMENSION_LABELS[h.dimension] ?? h.dimension}</span>
              <span className={cn('text-xs font-medium', h.type === 'positive' ? 'text-green-600' : 'text-red-600')}>
                {h.type === 'positive' ? '+ Good' : '− Needs work'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{h.note}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
