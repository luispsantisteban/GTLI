import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, transcripts, feedback } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [session, transcript, feedbackRow] = await Promise.all([
    db.query.sessions.findFirst({ where: eq(sessions.id, id) }),
    db.query.transcripts.findFirst({ where: eq(transcripts.sessionId, id) }),
    db.query.feedback.findFirst({ where: eq(feedback.sessionId, id) }),
  ])

  if (!session) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ session, transcript, feedback: feedbackRow })
}
