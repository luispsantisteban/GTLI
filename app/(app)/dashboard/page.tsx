import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, assignments, users } from '@/db/schema'
import { eq, desc, and, gte, sql } from 'drizzle-orm'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'
import { formatDuration } from '@/src/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId: clerkId } = await auth()

  let user = null
  let recentSessions: typeof sessions.$inferSelect[] = []
  let pendingAssignments: typeof assignments.$inferSelect[] = []

  try {
    user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId!) })

    if (user) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      recentSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, user.id))
        .orderBy(desc(sessions.startedAt))
        .limit(5)

      pendingAssignments = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.repId, user.id), sql`${assignments.completedAt} is null`))
        .limit(5)
    }
  } catch {
    // DB not yet connected — show empty state
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ready to practice your pitch?</p>
        </div>
        <Link href="/session/new">
          <Button size="lg">Start New Session</Button>
        </Link>
      </div>

      {pendingAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {pendingAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Sessions</CardTitle>
            <Link href="/history" className="text-sm text-indigo-600 hover:text-indigo-700">View all</Link>
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
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {SCENARIOS[s.scenario as keyof typeof SCENARIOS]?.label ?? s.scenario}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
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
                <Link href={`/feedback/${s.id}`}>
                  <Button variant="ghost" size="sm">View Feedback</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
