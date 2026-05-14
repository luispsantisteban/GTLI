import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, transcripts, feedback as feedbackTable, coachChats } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { anthropic, CLAUDE_MODEL } from '@/src/lib/claude'

const COACH_SYSTEM = `You are a sales coach for IIA (Instituto de Idiomas Americano). You have access to the full transcript and feedback report for this session. Answer the rep's questions honestly and constructively. Be specific — reference actual moments from the transcript. Speak in the same language the rep uses to address you.`

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, messages } = await req.json() as {
    sessionId: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  const [session, transcript, feedbackRow] = await Promise.all([
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    db.query.transcripts.findFirst({ where: eq(transcripts.sessionId, sessionId) }),
    db.query.feedback.findFirst({ where: eq(feedbackTable.sessionId, sessionId) }),
  ])

  const systemWithContext = `${COACH_SYSTEM}

## Session
Scenario: ${session?.scenario} | Difficulty: ${session?.difficulty} | Language: ${session?.language}

## Transcript
${JSON.stringify(transcript?.turns ?? [], null, 2)}

## Feedback Report
${JSON.stringify(feedbackRow ?? {}, null, 2)}`

  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemWithContext,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      // Persist chat history
      const fullText = await stream.finalText()
      const updated = [...messages, { role: 'assistant' as const, content: fullText, createdAt: new Date() }]
      await db.insert(coachChats).values({ sessionId, messages: updated })
        .onConflictDoUpdate({ target: coachChats.sessionId, set: { messages: updated, updatedAt: new Date() } })
        .catch(() => {})

      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
