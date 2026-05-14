import { auth } from '@clerk/nextjs/server'
import { anthropic, CLAUDE_MODEL } from '@/src/lib/claude'
import { buildWarmthUpdatePrompt } from '@/src/prompts/prospect-agent'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { turns, currentWarmth } = await req.json() as {
    turns: Array<{ speaker: string; text: string }>
    currentWarmth: number
  }

  const prompt = buildWarmthUpdatePrompt(turns, currentWarmth)

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : `${currentWarmth}`
  const warmth = Math.min(10, Math.max(1, parseInt(raw, 10) || currentWarmth))

  return Response.json({ warmth })
}
