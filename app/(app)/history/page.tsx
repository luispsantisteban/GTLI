import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, feedback, users } from '@/db/schema'
import { eq, desc, asc } from 'drizzle-orm'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'
import { getGradeColor, formatDuration } from '@/src/lib/utils'
import { TrendChart } from '@/src/components/history/TrendChart'
import Link from 'next/link'

export default async function HistoryPage() {
  const { userId: clerkId } = await auth()

  type SessionRow = {
    id: string
    scenario: string
    difficulty: string
    language: string
    startedAt: Date | null
    durationSeconds: number | null
    overallScore: number | null
    overallGrade: string | null
  }

  let rows: SessionRow[] = []

  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId!) })
    if (user) {
      const joined = await db
        .select({
          id: sessions.id,
          scenario: sessions.scenario,
          difficulty: sessions.difficulty,
          language: sessions.language,
          startedAt: sessions.startedAt,
          durationSeconds: sessions.durationSeconds,
          overallScore: feedback.overallScore,
          overallGrade: feedback.overallGrade,
        })
        .from(sessions)
        .leftJoin(feedback, eq(feedback.sessionId, sessions.id))
        .where(eq(sessions.userId, user.id))
        .orderBy(desc(sessions.startedAt))

      rows = joined
    }
  } catch {
    // DB not connected
  }

  const chartData = [...rows]
    .filter(r => r.overallScore !== null && r.startedAt !== null)
    .reverse()
    .map(r => ({
      date: new Date(r.startedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: r.overallScore!,
      scenario: r.scenario,
    }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My History</h1>

      <Card>
        <CardHeader><CardTitle>Score Trend</CardTitle></CardHeader>
        <TrendChart data={chartData} />
      </Card>

      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Sessions</h2>
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No sessions yet.</p>
            <Link href="/session/new" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
              Start your first practice →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {SCENARIOS[s.scenario as keyof typeof SCENARIOS]?.label ?? s.scenario}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge>{DIFFICULTIES[s.difficulty as keyof typeof DIFFICULTIES]?.label}</Badge>
                    {s.durationSeconds && (
                      <span className="text-xs text-gray-400">{formatDuration(s.durationSeconds)}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {s.startedAt ? new Date(s.startedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {s.overallGrade ? (
                    <div className="text-right">
                      <span className={`text-2xl font-black ${getGradeColor(s.overallGrade)}`}>
                        {s.overallGrade}
                      </span>
                      {s.overallScore !== null && (
                        <p className="text-xs text-gray-400">{s.overallScore}/100</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No feedback yet</span>
                  )}
                  <Link href={`/feedback/${s.id}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
