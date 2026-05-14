import { auth } from '@clerk/nextjs/server'
import { anthropic, CLAUDE_MODEL } from '@/src/lib/claude'
import { buildProspectSystemPrompt } from '@/src/prompts/prospect-agent'
import type { TranscriptTurn } from '@/src/types/session'
import type { ScenarioKey, DifficultyKey, Language } from '@/src/types/scenarios'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { turns, warmth, scenario, difficulty, language } = await req.json() as {
    sessionId: string
    turns: TranscriptTurn[]
    warmth: number
    scenario: ScenarioKey
    difficulty: DifficultyKey
    language: Language
  }

  const systemPrompt = buildProspectSystemPrompt(scenario, difficulty, language, warmth)

  const messages = turns.map(t => ({
    role: (t.speaker === 'rep' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: t.text,
  }))

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 256,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return Response.json({ text })
}
