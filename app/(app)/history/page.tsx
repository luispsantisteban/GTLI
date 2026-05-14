import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, feedback, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Card } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'
import { getGradeColor, formatDuration } from '@/src/lib/utils'
import Link from 'next/link'

export default async function HistoryPage() {
  const { userId: clerkId } = await auth()

  let rows: Array<typeof sessions.$inferSelect & { grade?: string | null; score?: number | null }> = []

  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId!) })
    if (user) {
      const rawSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, user.id))
        .orderBy(desc(sessions.startedAt))

      const feedbackRows = await db
        .select({ sessionId: feedback.sessionId, grade: feedback.overallGrade, score: feedback.overallScore })
        .from(feedback)
        .where(eq(feedback.sessionId, rawSessions[0]?.id ?? ''))

      const feedbackMap = Object.fromEntries(feedbackRows.map(r => [r.sessionId, r]))

      rows = rawSessions.map(s => ({
        ...s,
        grade: feedbackMap[s.id]?.grade ?? null,
        score: feedbackMap[s.id]?.score ?? null,
      }))
    }
  } catch {
    // DB not connected
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My History</h1>

      {rows.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-gray-400">
            <p>No sessions yet.</p>
            <Link href="/session/new" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
              Start your first practice →
            </Link>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-gray-100">
            {rows.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {SCENARIOS[s.scenario as keyof typeof SCENARIOS]?.label ?? s.scenario}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
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
                  {s.grade && (
                    <div className="text-right">
                      <span className={`text-2xl font-black ${getGradeColor(s.grade)}`}>{s.grade}</span>
                      {s.score && <p className="text-xs text-gray-400">{s.score}/100</p>}
                    </div>
                  )}
                  <Link href={`/feedback/${s.id}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
