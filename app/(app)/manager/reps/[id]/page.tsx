import { db } from '@/src/lib/db'
import { users, sessions, feedback as feedbackTable } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'
import { getGradeColor, formatDuration } from '@/src/lib/utils'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function RepDetailPage({ params }: Props) {
  let rep = null
  let repSessions: Array<typeof sessions.$inferSelect & { grade?: string | null }> = []

  try {
    rep = await db.query.users.findFirst({ where: eq(users.id, params.id) })
    if (rep) {
      const rawSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, rep.id))
        .orderBy(desc(sessions.startedAt))
        .limit(20)

      repSessions = rawSessions.map(s => ({ ...s, grade: null }))
    }
  } catch {}

  if (!rep) return <div className="text-gray-500 py-20 text-center">Rep not found.</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{rep.name}</h1>
        <p className="text-sm text-gray-400">{rep.email}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Session History</CardTitle></CardHeader>
        {repSessions.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No sessions yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {repSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {SCENARIOS[s.scenario as keyof typeof SCENARIOS]?.label ?? s.scenario}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{DIFFICULTIES[s.difficulty as keyof typeof DIFFICULTIES]?.label}</Badge>
                    {s.durationSeconds && (
                      <span className="text-xs text-gray-400">{formatDuration(s.durationSeconds)}</span>
                    )}
                  </div>
                </div>
                {s.grade && (
                  <span className={`text-xl font-black ${getGradeColor(s.grade)}`}>{s.grade}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
