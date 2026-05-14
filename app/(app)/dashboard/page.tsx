import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, assignments, users, feedback } from '@/db/schema'
import { eq, desc, and, sql, isNull, avg, count, gte } from 'drizzle-orm'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'
import { formatDuration, getGradeColor } from '@/src/lib/utils'
import Link from 'next/link'

const DIFFICULTY_ORDER = ['easy', 'skeptical', 'price_sensitive', 'aggressive'] as const

export default async function DashboardPage() {
  const { userId: clerkId } = await auth()

  let user = null
  let recentSessions: Array<{
    id: string; scenario: string; difficulty: string; startedAt: Date | null
    durationSeconds: number | null; overallScore: number | null; overallGrade: string | null
  }> = []
  let pendingAssignments: typeof assignments.$inferSelect[] = []
  let newUnlocks: Array<{ scenario: string; difficulty: string }> = []

  try {
    user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId!) })

    if (user) {
      // Recent sessions joined with feedback
      recentSessions = await db
        .select({
          id: sessions.id,
          scenario: sessions.scenario,
          difficulty: sessions.difficulty,
          startedAt: sessions.startedAt,
          durationSeconds: sessions.durationSeconds,
          overallScore: feedback.overallScore,
          overallGrade: feedback.overallGrade,
        })
        .from(sessions)
        .leftJoin(feedback, eq(feedback.sessionId, sessions.id))
        .where(eq(sessions.userId, user.id))
        .orderBy(desc(sessions.startedAt))
        .limit(5)

      // Pending assignments
      pendingAssignments = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.repId, user.id), isNull(assignments.completedAt)))
        .limit(5)

      // Difficulty progression — sessions with score >= 70, grouped by scenario+difficulty
      const progressRows = await db
        .select({
          scenario: sessions.scenario,
          difficulty: sessions.difficulty,
          sessionCount: count(sessions.id),
        })
        .from(sessions)
        .innerJoin(feedback, eq(feedback.sessionId, sessions.id))
        .where(and(eq(sessions.userId, user.id), gte(feedback.overallScore, 70)))
        .groupBy(sessions.scenario, sessions.difficulty)

      for (const row of progressRows) {
        if (Number(row.sessionCount) >= 3) {
          const idx = DIFFICULTY_ORDER.indexOf(row.difficulty as typeof DIFFICULTY_ORDER[number])
          const next = DIFFICULTY_ORDER[idx + 1]
          if (next) newUnlocks.push({ scenario: row.scenario, difficulty: next })
        }
      }
    }
  } catch {
    // DB not connected — show empty state
  }

  const hasPendingAssignments = pendingAssignments.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Ready to practice your pitch?</p>
        </div>
        <Link href="/session/new">
          <Button size="lg">Start New Session</Button>
        </Link>
      </div>

      {/* Unlock badges */}
      {newUnlocks.length > 0 && (
        <div className="space-y-2">
          {newUnlocks.map(({ scenario, difficulty }) => (
            <div key={`${scenario}-${difficulty}`}
              className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-sm font-semibold text-indigo-800">New difficulty unlocked!</p>
                <p className="text-xs text-indigo-600">
                  {DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES]?.label} tier for{' '}
                  {SCENARIOS[scenario as keyof typeof SCENARIOS]?.label ?? scenario}
                </p>
              </div>
              <Link href={`/session/new?scenario=${scenario}&difficulty=${difficulty}`} className="ml-auto">
                <Button size="sm">Try it</Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pending assignments */}
      {hasPendingAssignments && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Pending Assignments</CardTitle>
              <Badge variant="warning">{pendingAssignments.length}</Badge>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {pendingAssignments.map((a) => (
              <div key={a.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {SCENARIOS[a.scenario as keyof typeof SCENARIOS]?.label ?? a.scenario}
                  </p>
                  <p className="text-xs text-gray-500">
                    {DIFFICULTIES[a.difficulty as keyof typeof DIFFICULTIES]?.label} · Min score: {a.minScore}
                  </p>
                </div>
                <Link href={`/session/new?assignmentId=${a.id}&scenario=${a.scenario}&difficulty=${a.difficulty}`}>
                  <Button size="sm">Practice</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Sessions</CardTitle>
            <Link href="/history" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
        </CardHeader>
        {recentSessions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No sessions yet.</p>
            <p className="text-sm mt-1">Start your first practice session above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {SCENARIOS[s.scenario as keyof typeof SCENARIOS]?.label ?? s.scenario}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="default">
                      {DIFFICULTIES[s.difficulty as keyof typeof DIFFICULTIES]?.label ?? s.difficulty}
                    </Badge>
                    {s.durationSeconds && (
                      <span className="text-xs text-gray-400">{formatDuration(s.durationSeconds)}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {s.startedAt ? new Date(s.startedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {s.overallGrade && (
                    <span className={`text-xl font-black ${getGradeColor(s.overallGrade)}`}>
                      {s.overallGrade}
                    </span>
                  )}
                  <Link href={`/feedback/${s.id}`}>
                    <Button variant="ghost" size="sm">Feedback</Button>
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
