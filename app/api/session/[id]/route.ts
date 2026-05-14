import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, transcripts, feedback, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [session, transcript, feedbackRow] = await Promise.all([
    db.query.sessions.findFirst({ where: eq(sessions.id, params.id) }),
    db.query.transcripts.findFirst({ where: eq(transcripts.sessionId, params.id) }),
    db.query.feedback.findFirst({ where: eq(feedback.sessionId, params.id) }),
  ])

  if (!session) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ session, transcript, feedback: feedbackRow })
}
