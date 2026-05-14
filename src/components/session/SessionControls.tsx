'use client'

import type { SessionStatus } from '@/src/types/session'
import { Button } from '@/src/components/ui/Button'
import { cn } from '@/src/lib/utils'

interface SessionControlsProps {
  status: SessionStatus
  muted: boolean
  warmth: number
  duration: number
  onStart: () => void
  onEnd: () => void
  onToggleMute: () => void
}

export function SessionControls({
  status,
  muted,
  warmth,
  duration,
  onStart,
  onEnd,
  onToggleMute,
}: SessionControlsProps) {
  const isActive = status === 'listening' || status === 'processing' || status === 'speaking'
  const mins = Math.floor(duration / 60)
  const secs = duration % 60

  const warmthColor = warmth <= 3 ? 'bg-red-500' : warmth <= 6 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="flex items-center justify-between bg-gray-800 rounded-xl px-5 py-4">
      <div className="flex items-center gap-4">
        {isActive && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono tabular-nums">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Warmth</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-4 rounded-sm transition-all',
                    i < warmth ? warmthColor : 'bg-gray-700'
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-white">{warmth}/10</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {status === 'idle' && (
          <Button onClick={onStart} size="lg">
            Start Session
          </Button>
        )}
        {isActive && (
          <>
            <button
              onClick={onToggleMute}
              className={cn(
                'p-3 rounded-full transition-colors',
                muted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOffIcon /> : <MicOnIcon />}
            </button>
            <Button variant="danger" onClick={onEnd}>End Session</Button>
          </>
        )}
        {status === 'starting' && <Button loading disabled>Connecting…</Button>}
      </div>
    </div>
  )
}

function MicOnIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" fillRule="evenodd" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  )
}
