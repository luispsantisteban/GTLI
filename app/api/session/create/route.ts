import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { users, sessions } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import { getVoiceId } from '@/src/lib/elevenlabs'
import type { Language } from '@/src/types/scenarios'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { scenario, difficulty, language, assignmentId } = body as {
    scenario: string
    difficulty: string
    language: Language
    assignmentId?: string
  }

  // Ensure user exists
  let user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) {
    return Response.json({ error: 'User not found. Please complete onboarding.' }, { status: 404 })
  }

  // Rate limiting
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(eq(sessions.userId, user.id), gte(sessions.startedAt, today)))

  const limit = Number(process.env.RATE_LIMIT_SESSIONS_PER_REP_PER_DAY ?? 10)
  if (Number(count) >= limit) {
    return Response.json({ error: 'Daily session limit reached' }, { status: 429 })
  }

  // Create session record
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      scenario,
      difficulty,
      language,
      assignmentId: assignmentId ?? null,
    })
    .returning()

  const voiceId = getVoiceId(language)

  return Response.json({
    sessionId: session.id,
    deepgramApiKey: process.env.DEEPGRAM_API_KEY ?? '',
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? '',
    voiceId,
  })
}
