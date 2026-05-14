import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../../db/schema'

type DbType = ReturnType<typeof drizzle<typeof schema>>

let _db: DbType | null = null

function getInstance(): DbType {
  if (!_db) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
    _db = drizzle(neon(process.env.DATABASE_URL), { schema })
  }
  return _db
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as DbType, { get: (_, prop) => (getInstance() as any)[prop] })
