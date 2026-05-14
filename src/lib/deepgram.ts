export const DEEPGRAM_STT_WS_URL = 'wss://api.deepgram.com/v1/listen'

export function buildDeepgramWsUrl(apiKey: string, language: string): string {
  const params = new URLSearchParams({
    model: 'nova-2',
    language,
    punctuate: 'true',
    interim_results: 'true',
    utterance_end_ms: '1000',
    vad_events: 'true',
  })
  return `${DEEPGRAM_STT_WS_URL}?${params}&token=${apiKey}`
}

export function countFillerWords(text: string, language: 'es' | 'en' | 'pt'): number {
  const fillers: Record<string, string[]> = {
    es: ['o sea', 'este', 'verdad', 'como que', 'bueno', 'no'],
    en: ['um', 'uh', 'like', 'you know', 'basically', 'literally'],
    pt: ['né', 'tipo', 'então', 'sabe', 'cara'],
  }
  const list = fillers[language] ?? fillers.en
  const lower = text.toLowerCase()
  return list.reduce((count, filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    return count + (lower.match(regex)?.length ?? 0)
  }, 0)
}

export function detectLanguageCode(language: 'es' | 'en' | 'pt'): string {
  const map = { es: 'es-419', en: 'en-US', pt: 'pt-BR' }
  return map[language]
}
