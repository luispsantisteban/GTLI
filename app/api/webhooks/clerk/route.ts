import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { db } from '@/src/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

type ClerkUserCreatedEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    first_name: string | null
    last_name: string | null
    username: string | null
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
  }
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return Response.json({ error: 'Webhook secret not configured' }, { status: 500 })

  const headersList = await headers()
  const svix_id = headersList.get('svix-id')
  const svix_timestamp = headersList.get('svix-timestamp')
  const svix_signature = headersList.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.text()

  let evt: ClerkUserCreatedEvent
  try {
    const wh = new Webhook(secret)
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkUserCreatedEvent
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id: clerkId, first_name, last_name, username, email_addresses, primary_email_address_id } = evt.data

    const primaryEmail = email_addresses.find(e => e.id === primary_email_address_id)?.email_address
      ?? email_addresses[0]?.email_address
    if (!primaryEmail) return Response.json({ error: 'No email found' }, { status: 400 })

    const name = [first_name, last_name].filter(Boolean).join(' ') || username || primaryEmail.split('@')[0]

    await db.insert(users).values({ clerkId, name, email: primaryEmail, role: 'rep' })
      .onConflictDoNothing()
  }

  if (evt.type === 'user.updated') {
    const { id: clerkId, first_name, last_name, username, email_addresses, primary_email_address_id } = evt.data

    const primaryEmail = email_addresses.find(e => e.id === primary_email_address_id)?.email_address
      ?? email_addresses[0]?.email_address
    if (!primaryEmail) return Response.json({ ok: true })

    const name = [first_name, last_name].filter(Boolean).join(' ') || username || primaryEmail.split('@')[0]

    await db.update(users)
      .set({ name, email: primaryEmail })
      .where(eq(users.clerkId, clerkId))
  }

  return Response.json({ ok: true })
}
