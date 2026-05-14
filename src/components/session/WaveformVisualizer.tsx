'use client'

import { useEffect, useRef } from 'react'
import type { SessionStatus } from '@/src/types/session'

interface WaveformVisualizerProps {
  status: SessionStatus
  analyserNode?: AnalyserNode | null
}

export function WaveformVisualizer({ status, analyserNode }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!analyserNode || (status !== 'listening' && status !== 'processing')) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawIdleWave(ctx, canvas.width, canvas.height)
      return
    }

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      analyserNode.getByteTimeDomainData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#22c55e'
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyserNode, status])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className="w-full h-20 rounded-lg bg-gray-900"
    />
  )
}

function drawIdleWave(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()
}
