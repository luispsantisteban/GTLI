'use client'

import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DimensionScores } from '@/src/types/feedback'
import { DIMENSION_LABELS } from '@/src/types/feedback'

interface BenchmarkComparisonProps {
  yourScores: DimensionScores
  teamAvg?: Partial<DimensionScores>
  topPerformer?: Partial<DimensionScores>
}

export function BenchmarkComparison({ yourScores, teamAvg, topPerformer }: BenchmarkComparisonProps) {
  const data = (Object.keys(yourScores) as Array<keyof DimensionScores>).map(dim => ({
    name: DIMENSION_LABELS[dim].replace(' ', '\n').slice(0, 12),
    You: yourScores[dim],
    ...(teamAvg ? { 'Team avg': teamAvg[dim] ?? 0 } : {}),
    ...(topPerformer ? { 'Top performer': topPerformer[dim] ?? 0 } : {}),
  }))

  return (
    <Card>
      <CardHeader><CardTitle>Benchmark Comparison</CardTitle></CardHeader>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="You" fill="#6366f1" radius={[3, 3, 0, 0]} />
          {teamAvg && <Bar dataKey="Team avg" fill="#94a3b8" radius={[3, 3, 0, 0]} />}
          {topPerformer && <Bar dataKey="Top performer" fill="#22c55e" radius={[3, 3, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
