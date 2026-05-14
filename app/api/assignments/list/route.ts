import { auth } from '@clerk/nextjs/server'
import { db } from '@/src/lib/db'
import { users, assignments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) return Response.json({ assignments: [] })

  const rows = user.role === 'manager'
    ? await db.select().from(assignments).where(eq(assignments.managerId, user.id))
    : await db.select().from(assignments).where(eq(assignments.repId, user.id))

  return Response.json({ assignments: rows })
}
