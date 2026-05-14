import type { TranscriptTurn, DeepgramMetadata, ResistanceCurvePoint } from '../types/session'

export function buildFeedbackPrompt(
  transcript: TranscriptTurn[],
  deepgramMetadata: DeepgramMetadata,
  scenario: string,
  difficulty: string,
  language: 'es' | 'en' | 'pt',
  resistanceCurve: ResistanceCurvePoint[],
  idealPitchBenchmark?: string
): string {
  return `You are an expert sales coach evaluating a sales pitch for Instituto de Idiomas Americano (IIA), a language institute in Guatemala.

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
- resistance_outcome (0–10): Based on the resistance curve — did warmth improve over the session?`
}
