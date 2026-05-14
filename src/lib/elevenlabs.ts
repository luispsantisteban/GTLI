export const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

export function getVoiceId(language: 'es' | 'en' | 'pt'): string {
  const map: Record<string, string | undefined> = {
    es: process.env.ELEVENLABS_VOICE_ID_ES,
    en: process.env.ELEVENLABS_VOICE_ID_EN,
    pt: process.env.ELEVENLABS_VOICE_ID_PT,
  }
  return map[language] ?? ''
}

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<ArrayBuffer> {
  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  )
  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.status} ${response.statusText}`)
  }
  return response.arrayBuffer()
}
