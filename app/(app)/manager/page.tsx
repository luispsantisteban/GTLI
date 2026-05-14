import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { users, sessions, feedback as feedbackTable } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { getGradeColor } from '@/src/lib/utils'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export default async function ManagerDashboardPage() {
  const { userId: clerkId } = await auth()

  let reps: typeof users.$inferSelect[] = []

  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId!) })
    if (!user || user.role !== 'manager') {
      return (
        <div className="text-center py-20 text-gray-500">
          <p>Manager access required.</p>
        </div>
      )
    }
    reps = await db.select().from(users).where(eq(users.role, 'rep'))
  } catch {
    // DB not connected
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
        <Link href="/manager/assignments">
          <Button variant="secondary" size="sm">Manage Assignments</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Sales Reps</CardTitle></CardHeader>
        {reps.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No reps yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reps.map(rep => (
              <div key={rep.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{rep.name}</p>
                  <p className="text-xs text-gray-400">{rep.email}</p>
                </div>
                <Link href={`/manager/reps/${rep.id}`}>
                  <Button variant="ghost" size="sm">View →</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
