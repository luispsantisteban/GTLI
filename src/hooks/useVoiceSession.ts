'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from './useSession'
import { buildDeepgramWsUrl, countFillerWords, detectLanguageCode } from '@/src/lib/deepgram'
import { synthesizeSpeech } from '@/src/lib/elevenlabs'
import type { ScenarioKey, DifficultyKey } from '@/src/types/scenarios'
import type { TranscriptTurn } from '@/src/types/session'

export function useVoiceSession(scenario: ScenarioKey, difficulty: DifficultyKey) {
  const router = useRouter()
  const { state, refs, update, appendTurn, updateWarmth, getDeepgramMetadata } =
    useSession(scenario, difficulty)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const ttsQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenRef = useRef<{ deepgramApiKey: string; elevenLabsApiKey: string; voiceId: string } | null>(null)
  const repTurnStartMsRef = useRef(0)

  const language = scenario === 'spanish_for_americans' ? 'en' : 'es'

  // duration timer
  useEffect(() => {
    if (state.status === 'listening' || state.status === 'processing' || state.status === 'speaking') {
      timerRef.current = setInterval(() => {
        update({ duration: state.duration + 1 })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state.status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function playTtsQueue() {
    if (isPlayingRef.current || ttsQueueRef.current.length === 0) return
    isPlayingRef.current = true
    update({ status: 'speaking' })

    while (ttsQueueRef.current.length > 0) {
      const buffer = ttsQueueRef.current.shift()!
      await playAudioBuffer(buffer)
    }

    isPlayingRef.current = false
    update({ status: 'listening' })
  }

  async function playAudioBuffer(buffer: ArrayBuffer) {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const decoded = await audioCtxRef.current.decodeAudioData(buffer.slice(0))
    return new Promise<void>(resolve => {
      const source = audioCtxRef.current!.createBufferSource()
      source.buffer = decoded
      source.connect(audioCtxRef.current!.destination)
      source.onended = () => resolve()
      source.start()
    })
  }

  const handleFinalTranscript = useCallback(async (text: string, confidence: number) => {
    if (!text.trim() || !refs.sessionIdRef.current) return

    const now = Date.now()
    const startMs = repTurnStartMsRef.current
    const endMs = now - refs.startTimeRef.current

    const fillerCount = countFillerWords(text, language as 'es' | 'en' | 'pt')
    const repTurn: TranscriptTurn = {
      speaker: 'rep',
      text,
      startMs,
      endMs,
      confidence,
      fillerCount,
    }
    appendTurn(repTurn)
    update({ status: 'processing', interimText: '' })

    try {
      const turnRes = await fetch('/api/session/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: refs.sessionIdRef.current,
          turns: refs.turnsRef.current,
          warmth: refs.warmthRef.current,
          scenario,
          difficulty,
          language,
        }),
      })
      const { text: prospectText } = await turnRes.json()

      const prospectTurn: TranscriptTurn = {
        speaker: 'prospect',
        text: prospectText,
        startMs: endMs,
        endMs: Date.now() - refs.startTimeRef.current,
      }
      appendTurn(prospectTurn)

      // TTS
      if (tokenRef.current) {
        try {
          const audio = await synthesizeSpeech(
            prospectText,
            tokenRef.current.voiceId,
            tokenRef.current.elevenLabsApiKey
          )
          ttsQueueRef.current.push(audio)
          await playTtsQueue()
        } catch {
          update({ status: 'listening' })
        }
      } else {
        update({ status: 'listening' })
      }

      // warmth update (fire and forget)
      fetch('/api/session/warmth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: refs.turnsRef.current.slice(-4),
          currentWarmth: refs.warmthRef.current,
        }),
      })
        .then(r => r.json())
        .then(({ warmth }) => updateWarmth(warmth))
        .catch(() => {})

      repTurnStartMsRef.current = Date.now() - refs.startTimeRef.current
    } catch (err) {
      update({ error: 'Failed to get prospect response', status: 'listening' })
    }
  }, [scenario, difficulty, language]) // eslint-disable-line react-hooks/exhaustive-deps

  const startSession = useCallback(async () => {
    update({ status: 'starting', error: null })

    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, difficulty, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create session')

      refs.sessionIdRef.current = data.sessionId
      tokenRef.current = {
        deepgramApiKey: data.deepgramApiKey,
        elevenLabsApiKey: data.elevenLabsApiKey,
        voiceId: data.voiceId,
      }
      refs.startTimeRef.current = Date.now()
      repTurnStartMsRef.current = 0

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // Set up Web Audio analyser for waveform
      audioCtxRef.current = new AudioContext()
      const source = audioCtxRef.current.createMediaStreamSource(stream)
      const analyser = audioCtxRef.current.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      // Deepgram WebSocket
      const langCode = detectLanguageCode(language as 'es' | 'en' | 'pt')
      const wsUrl = buildDeepgramWsUrl(data.deepgramApiKey, langCode)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
        recorder.ondataavailable = (e) => {
          if (ws.readyState === WebSocket.OPEN && e.data.size > 0) {
            ws.send(e.data)
          }
        }
        recorder.start(250)
        mediaRecorderRef.current = recorder
        update({ status: 'listening' })
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'Results') {
          const alt = msg.channel?.alternatives?.[0]
          if (!alt) return
          if (msg.is_final) {
            if (alt.transcript?.trim()) {
              handleFinalTranscript(alt.transcript, alt.confidence ?? 0.9)
            }
          } else {
            update({ interimText: alt.transcript ?? '' })
          }
        }
      }

      ws.onerror = () => update({ error: 'Deepgram connection error', status: 'idle' })
      ws.onclose = () => {
        if (state.status !== 'ended') update({ status: 'idle' })
      }
    } catch (err: unknown) {
      update({ error: err instanceof Error ? err.message : 'Failed to start session', status: 'idle' })
    }
  }, [scenario, difficulty, language, handleFinalTranscript]) // eslint-disable-line react-hooks/exhaustive-deps

  const endSession = useCallback(async () => {
    update({ status: 'ended' })

    // Stop recording
    mediaRecorderRef.current?.stop()
    wsRef.current?.close()
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)

    if (!refs.sessionIdRef.current) return

    const metadata = getDeepgramMetadata()

    try {
      await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: refs.sessionIdRef.current,
          turns: refs.turnsRef.current,
          deepgramMetadata: metadata,
          resistanceCurve: refs.resistanceCurveRef.current,
          durationSeconds: state.duration,
        }),
      })
      router.push(`/feedback/${refs.sessionIdRef.current}`)
    } catch {
      router.push(`/feedback/${refs.sessionIdRef.current}`)
    }
  }, [state.duration, getDeepgramMetadata, router]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMute = useCallback(() => {
    const muted = !state.muted
    mediaStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted })
    update({ muted })
  }, [state.muted]) // eslint-disable-line react-hooks/exhaustive-deps

  // cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close()
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return {
    state,
    analyser: analyserRef.current,
    startSession,
    endSession,
    toggleMute,
  }
}
