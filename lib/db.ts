import { neon } from "@neondatabase/serverless";

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export function sql() {
  return getDb();
}

export async function initDb() {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id        SERIAL PRIMARY KEY,
      title     TEXT NOT NULL,
      url       TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
