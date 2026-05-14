import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, feedback, users } from '@/db/schema'
import { eq, and, avg, count, gte } from 'drizzle-orm'

const DIFFICULTY_ORDER = ['easy', 'skeptical', 'price_sensitive', 'aggressive'] as const

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) return Response.json({ unlocks: {} })

  const rows = await db
    .select({
      scenario: sessions.scenario,
      difficulty: sessions.difficulty,
      avgScore: avg(feedback.overallScore),
      sessionCount: count(sessions.id),
    })
    .from(sessions)
    .innerJoin(feedback, eq(feedback.sessionId, sessions.id))
    .where(and(eq(sessions.userId, user.id), gte(feedback.overallScore, 70)))
    .groupBy(sessions.scenario, sessions.difficulty)

  const unlocks: Record<string, string[]> = {}
  for (const row of rows) {
    if (Number(row.sessionCount) >= 3) {
      const currentIdx = DIFFICULTY_ORDER.indexOf(row.difficulty as typeof DIFFICULTY_ORDER[number])
      const nextDifficulty = DIFFICULTY_ORDER[currentIdx + 1]
      if (nextDifficulty) {
        if (!unlocks[row.scenario]) unlocks[row.scenario] = []
        if (!unlocks[row.scenario].includes(nextDifficulty)) {
          unlocks[row.scenario].push(nextDifficulty)
        }
      }
    }
  }

  return Response.json({ unlocks })
}
