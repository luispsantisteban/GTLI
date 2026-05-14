'use client'

import { useEffect, useRef } from 'react'
import type { TranscriptTurn } from '@/src/types/session'
import { cn } from '@/src/lib/utils'

interface LiveTranscriptProps {
  turns: TranscriptTurn[]
  interimText?: string
}

export function LiveTranscript({ turns, interimText }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, interimText])

  return (
    <div className="bg-gray-900 rounded-xl p-4 h-64 overflow-y-auto space-y-3 text-sm">
      {turns.length === 0 && !interimText && (
        <p className="text-gray-500 text-center mt-20 text-xs">Transcript will appear here…</p>
      )}
      {turns.map((turn, i) => (
        <div key={i} className={cn('flex gap-2', turn.speaker === 'rep' ? 'flex-row-reverse' : 'flex-row')}>
          <span className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
            turn.speaker === 'rep' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
          )}>
            {turn.speaker === 'rep' ? 'R' : 'P'}
          </span>
          <p className={cn(
            'max-w-xs px-3 py-2 rounded-2xl text-xs leading-relaxed',
            turn.speaker === 'rep'
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-700 text-gray-100 rounded-tl-sm'
          )}>
            {turn.text}
          </p>
        </div>
      ))}
      {interimText && (
        <div className="flex flex-row-reverse gap-2">
          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-indigo-400 text-white">R</span>
          <p className="max-w-xs px-3 py-2 rounded-2xl bg-indigo-400/50 text-white text-xs italic opacity-75">
            {interimText}
          </p>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
