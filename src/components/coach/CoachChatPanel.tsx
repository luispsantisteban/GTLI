'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/src/components/ui/Button'
import { cn } from '@/src/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CoachChatPanelProps {
  sessionId: string
}

export function CoachChatPanel({ sessionId }: CoachChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I reviewed your session. What would you like to discuss or improve?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages: next }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantText += decoder.decode(value)
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: assistantText }
            return updated
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <p className="font-semibold text-gray-800 text-sm">Sales Coach</p>
        <p className="text-xs text-gray-400">Ask questions about your session</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <span className={cn(
              'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            )}>
              {m.role === 'user' ? 'R' : 'C'}
            </span>
            <p className={cn(
              'max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed',
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            )}>
              {m.content || <span className="opacity-50">…</span>}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ask your coach…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <Button size="sm" onClick={send} loading={loading} disabled={!input.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}
