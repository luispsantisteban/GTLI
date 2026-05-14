import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { users, sessions, feedback } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const manager = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!manager || manager.role !== 'manager') {
    return Response.json({ error: 'Manager role required' }, { status: 403 })
  }

  const rows = await db
    .select({
      repName: users.name,
      repEmail: users.email,
      scenario: sessions.scenario,
      difficulty: sessions.difficulty,
      language: sessions.language,
      startedAt: sessions.startedAt,
      durationSeconds: sessions.durationSeconds,
      overallScore: feedback.overallScore,
      overallGrade: feedback.overallGrade,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(feedback, eq(feedback.sessionId, sessions.id))
    .where(eq(users.role, 'rep'))
    .orderBy(sessions.startedAt)

  const header = 'Rep Name,Email,Scenario,Difficulty,Language,Date,Duration (s),Score,Grade\n'
  const csv = rows.map(r => [
    `"${r.repName}"`,
    r.repEmail,
    r.scenario,
    r.difficulty,
    r.language,
    r.startedAt ? new Date(r.startedAt).toISOString().split('T')[0] : '',
    r.durationSeconds ?? '',
    r.overallScore ?? '',
    r.overallGrade ?? '',
  ].join(',')).join('\n')

  return new Response(header + csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sales-coach-export.csv"',
    },
  })
}
