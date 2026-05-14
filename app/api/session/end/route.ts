import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, transcripts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { TranscriptTurn, DeepgramMetadata, ResistanceCurvePoint } from '@/src/types/session'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, turns, deepgramMetadata, resistanceCurve, durationSeconds } = await req.json() as {
    sessionId: string
    turns: TranscriptTurn[]
    deepgramMetadata: DeepgramMetadata
    resistanceCurve: ResistanceCurvePoint[]
    durationSeconds: number
  }

  await db
    .update(sessions)
    .set({
      endedAt: new Date(),
      durationSeconds,
      resistanceCurve,
    })
    .where(eq(sessions.id, sessionId))

  await db.insert(transcripts).values({
    sessionId,
    turns,
    deepgramMetadata,
  })

  return Response.json({ ok: true })
}
