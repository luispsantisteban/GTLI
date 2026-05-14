import {
  pgTable, uuid, text, integer, jsonb, timestamp, boolean,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('rep'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  scenario: text('scenario').notNull(),
  difficulty: text('difficulty').notNull(),
  language: text('language').notNull(),
  resistanceCurve: jsonb('resistance_curve'),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds'),
  assignmentId: uuid('assignment_id'),
})

export const transcripts = pgTable('transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  turns: jsonb('turns').notNull(),
  deepgramMetadata: jsonb('deepgram_metadata'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id).unique(),
  scores: jsonb('scores').notNull(),
  overallScore: integer('overall_score'),
  overallGrade: text('overall_grade'),
  summary: text('summary'),
  strengths: jsonb('strengths'),
  improvements: jsonb('improvements'),
  highlights: jsonb('highlights'),
  timeline: jsonb('timeline'),
  language: text('language'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const benchmarks = pgTable('benchmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  scenario: text('scenario').notNull(),
  overallScore: integer('overall_score').notNull(),
  scores: jsonb('scores').notNull(),
  isBenchmarkSource: boolean('is_benchmark_source').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  managerId: uuid('manager_id').notNull().references(() => users.id),
  repId: uuid('rep_id').notNull().references(() => users.id),
  scenario: text('scenario').notNull(),
  difficulty: text('difficulty').notNull(),
  minScore: integer('min_score').notNull(),
  completedAt: timestamp('completed_at'),
  passed: boolean('passed'),
  sessionId: uuid('session_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const coachChats = pgTable('coach_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  messages: jsonb('messages').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
