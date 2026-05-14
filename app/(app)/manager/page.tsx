import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { users, sessions, feedback } from '@/db/schema'
import { eq, count, avg } from 'drizzle-orm'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Button } from '@/src/components/ui/Button'
import { getGradeColor } from '@/src/lib/utils'
import Link from 'next/link'

export default async function ManagerDashboardPage() {
  const { userId: clerkId } = await auth()

  let isManager = false
  let repStats: Array<{
    id: string; name: string; email: string
    sessionCount: number; avgScore: number | null
  }> = []

  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId!) })
    if (!user || user.role !== 'manager') {
      return (
        <div className="text-center py-20 text-gray-500">
          <p>Manager access required.</p>
        </div>
      )
    }
    isManager = true

    const reps = await db.select().from(users).where(eq(users.role, 'rep'))

    repStats = await Promise.all(reps.map(async (rep) => {
      const [stats] = await db
        .select({ sessionCount: count(sessions.id), avgScore: avg(feedback.overallScore) })
        .from(sessions)
        .leftJoin(feedback, eq(feedback.sessionId, sessions.id))
        .where(eq(sessions.userId, rep.id))
      return {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        sessionCount: Number(stats.sessionCount),
        avgScore: stats.avgScore ? Math.round(Number(stats.avgScore)) : null,
      }
    }))
  } catch {}

  if (!isManager) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
        <div className="flex gap-2">
          <a href="/api/manager/export">
            <Button variant="secondary" size="sm">Export CSV</Button>
          </a>
          <Link href="/manager/assignments">
            <Button size="sm">Manage Assignments</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-3xl font-bold text-gray-900">{repStats.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active reps</p>
        </Card>
        <Card>
          <p className="text-3xl font-bold text-gray-900">
            {repStats.reduce((n, r) => n + r.sessionCount, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total sessions</p>
        </Card>
        <Card>
          <p className="text-3xl font-bold text-gray-900">
            {repStats.filter(r => r.avgScore !== null).length > 0
              ? Math.round(
                  repStats.filter(r => r.avgScore !== null)
                    .reduce((n, r) => n + r.avgScore!, 0) /
                  repStats.filter(r => r.avgScore !== null).length
                )
              : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Team avg score</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Sales Reps</h2>
        </div>
        {repStats.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">No reps yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {repStats.map(rep => (
              <div key={rep.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{rep.name}</p>
                  <p className="text-xs text-gray-400">{rep.email}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center hidden sm:block">
                    <p className="text-lg font-bold text-gray-700">{rep.sessionCount}</p>
                    <p className="text-xs text-gray-400">sessions</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${rep.avgScore ? getGradeColor(
                      rep.avgScore >= 90 ? 'A' : rep.avgScore >= 80 ? 'B' : rep.avgScore >= 70 ? 'C' : rep.avgScore >= 60 ? 'D' : 'F'
                    ) : 'text-gray-400'}`}>
                      {rep.avgScore ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400">avg score</p>
                  </div>
                  <Link href={`/manager/reps/${rep.id}`}>
                    <Button variant="ghost" size="sm">View →</Button>
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
