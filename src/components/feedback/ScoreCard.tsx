import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { DimensionScore } from './DimensionScore'
import { getGradeColor } from '@/src/lib/utils'
import type { FeedbackObject } from '@/src/types/feedback'

interface ScoreCardProps {
  feedback: FeedbackObject
}

export function ScoreCard({ feedback }: ScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Scorecard</CardTitle>
          <div className="text-right">
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black ${getGradeColor(feedback.overall_grade)}`}>
                {feedback.overall_grade}
              </span>
              <span className="text-2xl font-bold text-gray-400">{feedback.overall_score}</span>
            </div>
            <p className="text-xs text-gray-400">Overall score</p>
          </div>
        </div>
      </CardHeader>

      <p className="text-sm text-gray-600 mb-6 leading-relaxed">{feedback.summary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(Object.keys(feedback.scores) as Array<keyof typeof feedback.scores>).map(dim => (
          <DimensionScore
            key={dim}
            dimension={dim}
            score={feedback.scores[dim]}
            comment={feedback.score_comments?.[dim]}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Strengths</p>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800 flex gap-2">
                <span>✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Improvements</p>
          <ul className="space-y-1">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="text-sm text-amber-800 flex gap-2">
                <span>→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
