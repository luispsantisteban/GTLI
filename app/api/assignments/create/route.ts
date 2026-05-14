import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { users, assignments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const manager = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!manager || manager.role !== 'manager') {
    return Response.json({ error: 'Manager role required' }, { status: 403 })
  }

  const { repId, scenario, difficulty, minScore } = await req.json() as {
    repId: string
    scenario: string
    difficulty: string
    minScore: number
  }

  const [assignment] = await db
    .insert(assignments)
    .values({ managerId: manager.id, repId, scenario, difficulty, minScore })
    .returning()

  return Response.json({ assignment })
}
