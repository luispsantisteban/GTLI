# CLAUDE.md — Sales Coach App

This file is the single source of truth for building the Sales Coach web app.
Read it fully before writing any code. Follow the phases in order.

---

## What this app does

A web app for IIA (Instituto de Idiomas Americano) sales reps to practice sales pitches
by having a live voice conversation with an AI prospect, then receive structured feedback
on their performance.

**Voice pipeline:**
- Rep speaks → Deepgram (streaming STT) → text sent to Claude (prospect agent)
- Claude responds as the prospect → ElevenLabs (streaming TTS) → rep hears the response

**After the session:**
- Claude analyzes the full transcript and returns a structured scorecard
- Feedback includes dimension scores, quote highlights, a conversation timeline,
  voice signal analysis (pace, fillers, silence), and an overall grade

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Deploy | Vercel |
| STT | Deepgram (WebSocket streaming) |
| LLM | Anthropic Claude API (claude-sonnet-4-20250514) |
| TTS | ElevenLabs (streaming) |
| Charts | Recharts |
| Error monitoring | Sentry |
| Testing | Playwright (E2E) |

---

## Environment variables

Create `.env.local` at project root. All must also be set in Vercel dashboard.

```
# Deepgram
DEEPGRAM_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID_ES=       # Spanish prospect voice
ELEVENLABS_VOICE_ID_EN=       # English prospect voice
ELEVENLABS_VOICE_ID_PT=       # Portuguese prospect voice

# Neon
DATABASE_URL=                  # Neon connection string (pooled)
DATABASE_URL_UNPOOLED=         # Neon direct connection (for migrations)

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:5173

# Sentry
SENTRY_DSN=

# Rate limiting
RATE_LIMIT_SESSIONS_PER_REP_PER_DAY=10
```

---

## File structure

```
/
├── CLAUDE.md
├── .env.local
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── package.json
├── tsconfig.json
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── pages/
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   ├── Dashboard.tsx          # Rep home: recent sessions, assignments
│   │   ├── NewSession.tsx         # Scenario + difficulty selector
│   │   ├── Session.tsx            # Live voice conversation UI
│   │   ├── Feedback.tsx           # Post-session scorecard + timeline + replay
│   │   ├── History.tsx            # Rep's past sessions + trend charts
│   │   ├── CoachChat.tsx          # Post-session coach conversation
│   │   └── manager/
│   │       ├── ManagerDashboard.tsx
│   │       ├── Assignments.tsx
│   │       └── RepDetail.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── session/
│   │   │   ├── WaveformVisualizer.tsx
│   │   │   ├── LiveTranscript.tsx
│   │   │   ├── SessionControls.tsx
│   │   │   └── ScenarioSelector.tsx
│   │   ├── feedback/
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── DimensionScore.tsx
│   │   │   ├── ConversationTimeline.tsx
│   │   │   ├── QuoteHighlights.tsx
│   │   │   ├── VoiceSignals.tsx
│   │   │   └── BenchmarkComparison.tsx
│   │   ├── coach/
│   │   │   └── CoachChatPanel.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       └── Spinner.tsx
│   │
│   ├── hooks/
│   │   ├── useVoiceSession.ts     # Deepgram WebSocket + ElevenLabs audio
│   │   ├── useProspectAgent.ts    # Claude agent turn management
│   │   └── useSession.ts          # Session state machine
│   │
│   ├── lib/
│   │   ├── deepgram.ts            # Deepgram client helpers
│   │   ├── claude.ts              # Anthropic client helpers
│   │   ├── elevenlabs.ts          # ElevenLabs client helpers
│   │   ├── db.ts                  # Drizzle + Neon client
│   │   └── utils.ts
│   │
│   ├── prompts/
│   │   ├── prospect-agent.ts      # System prompt builder for the AI prospect
│   │   └── feedback-engine.ts     # Feedback scoring prompt builder
│   │
│   └── types/
│       ├── session.ts
│       ├── feedback.ts
│       └── scenarios.ts
│
├── api/                           # Vercel serverless functions
│   ├── session/
│   │   └── create.ts              # POST /api/session/create
│   ├── session/
│   │   └── end.ts                 # POST /api/session/end
│   ├── feedback/
│   │   └── generate.ts            # POST /api/feedback/generate (SSE)
│   ├── coach/
│   │   └── chat.ts                # POST /api/coach/chat
│   └── assignments/
│       ├── create.ts              # POST /api/assignments/create (manager only)
│       └── list.ts                # GET /api/assignments/list
│
└── db/
    ├── schema.ts                  # Full Drizzle schema
    └── migrations/                # Auto-generated by drizzle-kit
```

---

## Database schema

Define in `db/schema.ts` using Drizzle ORM.

```typescript
import { pgTable, uuid, text, integer, jsonb,
         timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('rep'), // 'rep' | 'manager'
  createdAt: timestamp('created_at').defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  scenario: text('scenario').notNull(),       // e.g. 'english_enrollment'
  difficulty: text('difficulty').notNull(),   // 'easy' | 'skeptical' | 'price_sensitive' | 'aggressive'
  language: text('language').notNull(),       // 'es' | 'en' | 'pt'
  resistanceCurve: jsonb('resistance_curve'), // array of {turn, warmth} for timeline
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds'),
  assignmentId: uuid('assignment_id'),        // null if free practice
})

export const transcripts = pgTable('transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  turns: jsonb('turns').notNull(), // array of {speaker, text, startMs, endMs, confidence, fillerCount}
  deepgramMetadata: jsonb('deepgram_metadata'), // pace, silence_durations, overall_confidence
  createdAt: timestamp('created_at').defaultNow(),
})

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id).unique(),
  scores: jsonb('scores').notNull(),          // {hook, flow, value_prop, tone, objections,
                                              //  personalization, cta, filler_words, pace,
                                              //  silence, session_memory, resistance_outcome}
  overallScore: integer('overall_score'),     // 0–100
  overallGrade: text('overall_grade'),        // 'A' | 'B' | 'C' | 'D' | 'F'
  summary: text('summary'),
  strengths: jsonb('strengths'),              // string[]
  improvements: jsonb('improvements'),        // string[]
  highlights: jsonb('highlights'),            // [{quote, type: 'positive'|'negative', dimension, note}]
  timeline: jsonb('timeline'),                // [{turnIndex, warmth, event}]
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
  minScore: integer('min_score').notNull(),   // rep must hit this to unlock free practice
  completedAt: timestamp('completed_at'),
  passed: boolean('passed'),
  sessionId: uuid('session_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const coachChats = pgTable('coach_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  messages: jsonb('messages').notNull(), // [{role, content, createdAt}]
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

Run migrations with: `npx drizzle-kit push`

---

## Scenarios

Define in `src/types/scenarios.ts`:

```typescript
export const SCENARIOS = {
  english_enrollment: {
    label: 'English course enrollment',
    language: 'es',
    prospectDescription: 'Young professional in Guatemala City, interested in English for career advancement. Has limited time and is sensitive about cost.',
  },
  korean_course: {
    label: 'Korean course enrollment',
    language: 'es',
    prospectDescription: 'Student aged 18–24, curious about Korean culture and K-pop. Budget-conscious. Skeptical about whether the institute is qualified to teach Korean.',
  },
  portuguese_trial: {
    label: 'Portuguese free trial',
    language: 'es',
    prospectDescription: 'Business owner with Brazilian clients who needs basic Portuguese quickly. Very busy, time is the main objection.',
  },
  spanish_for_americans: {
    label: 'Spanish course (American student)',
    language: 'en',
    prospectDescription: 'American expat or tourist in Guatemala wanting conversational Spanish. Comparing IIA to apps like Duolingo. Main objection: why pay for classes?',
  },
}

export const DIFFICULTIES = {
  easy: {
    label: 'Easy',
    description: 'Warm prospect, open to hearing the pitch, minor objections only.',
    resistanceStart: 5, // neutral-warm
  },
  skeptical: {
    label: 'Skeptical',
    description: 'Prospect starts doubtful and asks hard questions about quality and results.',
    resistanceStart: 3,
  },
  price_sensitive: {
    label: 'Price-sensitive',
    description: 'Prospect immediately raises price as the main blocker.',
    resistanceStart: 4,
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Prospect is impatient, interrupts, and challenges every claim.',
    resistanceStart: 2,
  },
}
```

---

## Prospect agent prompt

Define in `src/prompts/prospect-agent.ts`:

```typescript
export function buildProspectSystemPrompt(
  scenario: keyof typeof SCENARIOS,
  difficulty: keyof typeof DIFFICULTIES,
  language: 'es' | 'en' | 'pt',
  warmth: number // 1–10, updated each turn
): string {
  const s = SCENARIOS[scenario]
  const d = DIFFICULTIES[difficulty]

  return `
You are a prospective student for Instituto de Idiomas Americano (IIA), a language institute in Guatemala.

## Your persona
${s.prospectDescription}

## Your current warmth level: ${warmth}/10
- 1–3: Cold. You are skeptical, impatient, and likely to end the call soon if things don't improve.
- 4–6: Neutral. You are listening but unconvinced. You need more to commit.
- 7–9: Warm. You are interested and asking genuine questions.
- 10: Ready to enroll. The rep has done an excellent job.

## Difficulty: ${d.label}
${d.description}

## Behavior rules
- Respond ONLY as the prospect. Never break character.
- Keep responses short (1–4 sentences). You are a real person on a call, not a chatbot.
- Adjust your tone based on your current warmth level.
- If warmth ≤ 2 and the rep has been poor for 3+ turns, end the call naturally.
- Use natural ${language === 'es' ? 'Guatemalan Spanish' : language === 'en' ? 'American English' : 'Brazilian Portuguese'}.
- Do NOT volunteer information — make the rep work for it.
- Common objections to use (pick based on scenario and difficulty):
  - "¿Cuánto cuesta?" / "That sounds expensive"
  - "No tengo tiempo" / "I'm really busy"
  - "¿Por qué no uso Duolingo?"
  - "¿Tienen buenos profesores?"
  - "¿Cuál es la diferencia con otros institutos?"
- If the rep asks a good qualifying question, answer it genuinely.
- If the rep gives a strong value proposition relevant to your situation, warm up by 1–2 points.
- If the rep is pushy, ignores your objections, or sounds scripted, cool down by 1–2 points.

## Session memory
Remember everything said in this conversation. If the rep already told you the price, don't ask again.
If the rep promised something specific, hold them to it.

## End of session
When the rep gives a clear call to action (schedule a visit, enroll, free trial), respond naturally
as a prospect who is at their current warmth level. A warm prospect will agree or ask one final
clarifying question. A cold prospect will decline or ask to be called back.
`
}
```

**Warmth tracking:** After each rep turn, send the transcript so far to a separate lightweight
Claude call that returns only the updated warmth integer (1–10). Store it per turn in the
`resistanceCurve` field on the session.

---

## Feedback engine prompt

Define in `src/prompts/feedback-engine.ts`:

```typescript
export function buildFeedbackPrompt(
  transcript: TranscriptTurn[],
  deepgramMetadata: DeepgramMetadata,
  scenario: string,
  difficulty: string,
  language: 'es' | 'en' | 'pt',
  resistanceCurve: ResistanceCurvePoint[],
  idealPitchBenchmark?: string
): string {
  return `
You are an expert sales coach evaluating a sales pitch for Instituto de Idiomas Americano (IIA),
a language institute in Guatemala.

## Transcript
${JSON.stringify(transcript, null, 2)}

## Voice data (from Deepgram)
- Average speaking pace: ${deepgramMetadata.wordsPerMinute} words/minute (ideal: 120–150)
- Silence gaps > 3s: ${deepgramMetadata.longSilences} occurrences
- Filler words detected: ${deepgramMetadata.fillerWords} total
- Average confidence score: ${deepgramMetadata.avgConfidence}

## Resistance curve
${JSON.stringify(resistanceCurve, null, 2)}
(warmth 1=cold, 10=ready to enroll — how the prospect felt turn by turn)

## Scenario: ${scenario} | Difficulty: ${difficulty} | Language: ${language}
${idealPitchBenchmark ? `\n## Ideal pitch reference\n${idealPitchBenchmark}` : ''}

## Your task
Evaluate the rep's performance and return a JSON object with this exact structure.
Return ONLY valid JSON — no preamble, no markdown, no explanation outside the JSON.

{
  "scores": {
    "hook": <0–10>,
    "flow": <0–10>,
    "value_prop": <0–10>,
    "tone": <0–10>,
    "objections": <0–10>,
    "personalization": <0–10>,
    "cta": <0–10>,
    "filler_words": <0–10>,
    "pace": <0–10>,
    "silence_handling": <0–10>,
    "session_memory": <0–10>,
    "resistance_outcome": <0–10>
  },
  "score_comments": {
    "hook": "<one sentence explaining the score>",
    "flow": "...",
    "value_prop": "...",
    "tone": "...",
    "objections": "...",
    "personalization": "...",
    "cta": "...",
    "filler_words": "...",
    "pace": "...",
    "silence_handling": "...",
    "session_memory": "...",
    "resistance_outcome": "..."
  },
  "overall_score": <0–100>,
  "overall_grade": "<A|B|C|D|F>",
  "summary": "<2–3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "highlights": [
    {
      "quote": "<exact words from transcript>",
      "type": "<positive|negative>",
      "dimension": "<which score dimension this relates to>",
      "note": "<why this moment mattered>"
    }
  ],
  "timeline": [
    {
      "turnIndex": <integer>,
      "warmth": <1–10>,
      "event": "<optional: what caused warmth to change>"
    }
  ]
}

## Scoring language notes
- If the conversation was in Spanish: evaluate filler words in Spanish context
  (e.g. "o sea", "este", "¿verdad?", "como que")
- If in English: evaluate for English filler words and cultural tone expectations
  (directness, confident but not pushy)
- If in Portuguese: evaluate for Brazilian Portuguese conventions

## Scoring criteria
- hook (0–10): Was the opening clear, engaging, and relevant to the prospect?
- flow (0–10): Did the pitch follow a logical problem→solution→value→CTA structure?
- value_prop (0–10): Did the rep clearly explain what IIA offers and why it matters to THIS prospect?
- tone (0–10): Confident, warm, not robotic or aggressive?
- objections (0–10): Did they handle objections calmly and with substance?
- personalization (0–10): Did they adapt to what the prospect said, or sound scripted?
- cta (0–10): Was there a specific, clear next step with mild urgency?
- filler_words (0–10): 10=none detected, deduct 1 per 3 filler words above threshold of 5
- pace (0–10): 10=120–150 wpm, deduct for significantly faster or slower
- silence_handling (0–10): Long silences (>3s) = loss of control; well-timed pauses = good
- session_memory (0–10): Did the rep remember and use information the prospect shared earlier?
- resistance_outcome (0–10): Based on the resistance curve — did warmth improve over the session?
`
}
```

---

## API endpoints

### POST /api/session/create

Creates a session record, returns tokens for Deepgram and ElevenLabs.

```typescript
// Request body
{
  scenario: string
  difficulty: string
  language: 'es' | 'en' | 'pt'
  assignmentId?: string
}

// Response
{
  sessionId: string
  deepgramApiKey: string      // short-lived token from Deepgram API
  elevenLabsApiKey: string    // from env, scoped
  voiceId: string             // selected based on language
}
```

### POST /api/session/end

Saves the full transcript and Deepgram metadata to Neon.

```typescript
// Request body
{
  sessionId: string
  turns: TranscriptTurn[]
  deepgramMetadata: DeepgramMetadata
  resistanceCurve: ResistanceCurvePoint[]
  durationSeconds: number
}
```

### POST /api/feedback/generate

Calls Claude with the feedback prompt. Streams the response via SSE.
Parse the streamed JSON and save to Neon when complete.

```typescript
// Request body
{ sessionId: string }

// SSE events
data: {"type":"progress","message":"Analyzing transcript..."}
data: {"type":"progress","message":"Scoring dimensions..."}
data: {"type":"complete","feedback": { ...FeedbackObject }}
```

### POST /api/coach/chat

Sends a coach chat message with full transcript + feedback as context.

```typescript
// Request body
{
  sessionId: string
  messages: { role: 'user' | 'assistant', content: string }[]
}

// Response (streamed)
{ role: 'assistant', content: string }
```

**Coach system prompt:**
```
You are a sales coach for IIA (Instituto de Idiomas Americano). You have access to the
full transcript and feedback report for this session. Answer the rep's questions honestly
and constructively. Be specific — reference actual moments from the transcript.
Speak in the same language the rep uses to address you.
```

### POST /api/assignments/create (manager only)

```typescript
{
  repId: string
  scenario: string
  difficulty: string
  minScore: number
}
```

---

## Voice session flow (client-side)

Implement in `src/hooks/useVoiceSession.ts`:

```
1. Call POST /api/session/create → get sessionId, deepgramApiKey, voiceId
2. Open Deepgram WebSocket with interim_results=true, language based on scenario
3. Start microphone stream → pipe to Deepgram WebSocket
4. On Deepgram final transcript event:
   a. Append turn to local state (speaker: 'rep', text, startMs, endMs, confidence)
   b. Count filler words in the turn
   c. Call Claude prospect agent with full conversation history + current warmth
   d. On Claude response: append turn (speaker: 'prospect', text)
   e. Call ElevenLabs TTS with prospect text → stream audio → play via Web Audio API
   f. After audio plays: call warmth-update Claude call → update resistanceCurve
5. On session end (user clicks End or agent ends call):
   a. Close Deepgram WebSocket
   b. POST /api/session/end with all accumulated data
   c. Navigate to /feedback/:sessionId
   d. Trigger POST /api/feedback/generate (SSE) and stream results onto the page
```

---

## Conversation timeline UI

In `src/components/feedback/ConversationTimeline.tsx`:

- Horizontal bar representing the full session duration
- Color-coded by warmth: red (1–3), yellow (4–6), green (7–10)
- Clickable segments — clicking a segment seeks the audio replay to that moment
- Tooltip on hover: turn text + warmth + event (e.g. "Rep handled price objection well")
- Data source: `feedback.timeline` array from Neon

---

## Replay feature

On the Feedback page:

- Store the session audio as a Blob URL during the session (Web Audio API recording)
- On the Feedback page, expose a `<audio>` element (hidden) controlled programmatically
- Clicking a timeline segment or a quote highlight seeks to that timestamp
- Timestamp is derived from `turn.startMs` in the transcript

---

## Benchmarking logic

In `src/components/feedback/BenchmarkComparison.tsx`:

- Fetch avg scores across all reps for the same scenario from `benchmarks` table
- Fetch max scores from reps flagged as `isBenchmarkSource=true`
- Display as a bar chart (Recharts): rep score vs team avg vs top performer
- Anonymized — never show names, only "You", "Team avg", "Top performer"

---

## Difficulty progression

A rep unlocks the next difficulty tier when:
- They complete at least 3 sessions at the current tier for a given scenario
- AND their average overall_score across those 3 sessions is ≥ 70

Track in the `benchmarks` table. Check on Dashboard load and show a badge
"You unlocked Skeptical tier for English Enrollment!" when newly unlocked.

---

## Multilingual scoring rules

Set in the feedback prompt based on `language`:

| Language | Filler words to flag | Tone notes |
|---|---|---|
| `es` | o sea, este, ¿verdad?, como que, bueno, ¿no? | Warm but professional; avoid cold formality |
| `en` | um, uh, like, you know, basically, literally | Direct, confident; avoid being pushy |
| `pt` | né, tipo, então, sabe, cara | Natural Brazilian warmth; avoid European formality |

---

## Rate limiting

In each Vercel function, check before processing:

```typescript
const today = new Date().toISOString().split('T')[0]
const count = await db
  .select({ count: sql`count(*)` })
  .from(sessions)
  .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, new Date(today))))

if (count[0].count >= Number(process.env.RATE_LIMIT_SESSIONS_PER_REP_PER_DAY)) {
  return Response.json({ error: 'Daily session limit reached' }, { status: 429 })
}
```

---

## Build order (phases)

### Phase 1 — Bootstrap (day 1)
- [ ] Init Vite + React + TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Set up Clerk auth (sign in, sign up, protected routes)
- [ ] Provision Neon DB, configure Drizzle
- [ ] Create full schema and run first migration
- [ ] Set up Vercel project, connect GitHub, deploy empty app
- [ ] Verify all env vars resolve in Vercel preview

### Phase 2 — Voice pipeline (days 2–4)
- [ ] Build ScenarioSelector page with scenario + difficulty + language pickers
- [ ] Implement `useVoiceSession` hook (Deepgram WebSocket + mic stream)
- [ ] Build prospect agent Claude call with `buildProspectSystemPrompt`
- [ ] Implement ElevenLabs TTS streaming + Web Audio API playback
- [ ] Build warmth-update Claude call (runs after each agent turn)
- [ ] Build Session page: waveform visualizer, live transcript, start/end controls
- [ ] Implement POST /api/session/create and POST /api/session/end
- [ ] Verify full turn loop works end-to-end

### Phase 3 — Feedback engine (days 5–6)
- [ ] Build POST /api/feedback/generate with SSE streaming
- [ ] Implement `buildFeedbackPrompt` with all scoring dimensions
- [ ] Build Feedback page: ScoreCard, DimensionScore components
- [ ] Build ConversationTimeline component (warmth heatmap)
- [ ] Build QuoteHighlights component (positive/negative quote cards)
- [ ] Build VoiceSignals component (pace, fillers, silence stats)
- [ ] Wire audio replay to timeline and quote highlights
- [ ] Add ideal pitch benchmark storage and injection into prompt

### Phase 4 — Coach mode + rep growth (days 7–8)
- [ ] Build POST /api/coach/chat endpoint
- [ ] Build CoachChat page with conversation UI and session context
- [ ] Build History page with Recharts trend lines per dimension
- [ ] Implement difficulty progression logic and unlock badges
- [ ] Build BenchmarkComparison component (Recharts bar chart)

### Phase 5 — Manager dashboard (days 9–10)
- [ ] Build ManagerDashboard with all-reps table
- [ ] Build Assignments page: create, list, track completion
- [ ] Implement assignment gating on rep Dashboard
- [ ] Add CSV export for rep scores
- [ ] Add benchmark source flagging (manager can opt a rep in)

### Phase 6 — Polish + production (day 11)
- [ ] Mobile-responsive layout on all pages
- [ ] PWA manifest + service worker for iOS install
- [ ] Sentry error monitoring (frontend + API)
- [ ] Playwright E2E tests: full session flow, feedback generation, assignment gating
- [ ] Rate limiting on /api/session/create and /api/feedback/generate
- [ ] Admin cost dashboard (count sessions, estimate API spend)
- [ ] Final accessibility pass (keyboard nav, ARIA labels)

---

## Key constraints

- **Never store raw API keys client-side.** Deepgram and ElevenLabs tokens must be
  retrieved via the /api/session/create Vercel function and used only in the browser session.
- **Always clean up the Deepgram WebSocket** on component unmount.
- **ElevenLabs audio must queue properly.** If the agent responds while TTS is still playing,
  queue the next audio chunk — do not cut off mid-sentence.
- **Claude prospect agent calls must include full conversation history** on each turn
  for session memory to work correctly.
- **Feedback JSON parsing:** Strip any markdown fences before `JSON.parse()`.
  Claude sometimes wraps JSON in ```json blocks even when instructed not to.
- **Neon requires `DATABASE_URL_UNPOOLED`** for Drizzle migrations. Use pooled URL for
  all runtime queries.
- **Clerk middleware** must wrap all `/api/*` routes to verify the session token.
