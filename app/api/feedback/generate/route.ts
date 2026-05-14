import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { sessions, transcripts, feedback } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { anthropic, CLAUDE_MODEL } from '@/src/lib/claude'
import { buildFeedbackPrompt } from '@/src/prompts/feedback-engine'
import type { FeedbackObject } from '@/src/types/feedback'
import type { TranscriptTurn, DeepgramMetadata, ResistanceCurvePoint } from '@/src/types/session'

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await req.json() as { sessionId: string }

  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) })
  if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

  const transcript = await db.query.transcripts.findFirst({ where: eq(transcripts.sessionId, sessionId) })
  if (!transcript) return Response.json({ error: 'Transcript not found' }, { status: 404 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(sse({ type: 'progress', message: 'Analyzing transcript…' })))

        const turns = transcript.turns as TranscriptTurn[]
        const metadata = (transcript.deepgramMetadata as DeepgramMetadata) ?? {
          wordsPerMinute: 0, longSilences: 0, fillerWords: 0, avgConfidence: 0.9,
        }
        const resistanceCurve = (session.resistanceCurve as ResistanceCurvePoint[]) ?? []

        controller.enqueue(encoder.encode(sse({ type: 'progress', message: 'Scoring dimensions…' })))

        const prompt = buildFeedbackPrompt(
          turns,
          metadata,
          session.scenario,
          session.difficulty,
          session.language as 'es' | 'en' | 'pt',
          resistanceCurve
        )

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
        const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
        const result = JSON.parse(cleaned) as FeedbackObject

        // Persist to DB
        await db.insert(feedback).values({
          sessionId,
          scores: result.scores,
          overallScore: result.overall_score,
          overallGrade: result.overall_grade,
          summary: result.summary,
          strengths: result.strengths,
          improvements: result.improvements,
          highlights: result.highlights,
          timeline: result.timeline,
          language: session.language,
        }).onConflictDoUpdate({
          target: feedback.sessionId,
          set: {
            scores: result.scores,
            overallScore: result.overall_score,
            overallGrade: result.overall_grade,
            summary: result.summary,
            strengths: result.strengths,
            improvements: result.improvements,
            highlights: result.highlights,
            timeline: result.timeline,
          },
        })

        controller.enqueue(encoder.encode(sse({ type: 'complete', feedback: result })))
      } catch (err) {
        controller.enqueue(encoder.encode(sse({ type: 'error', message: String(err) })))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
