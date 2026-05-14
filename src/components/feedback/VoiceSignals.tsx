import { Card, CardHeader, CardTitle } from '@/src/components/ui/Card'
import type { DeepgramMetadata } from '@/src/types/session'
import { cn } from '@/src/lib/utils'

interface VoiceSignalsProps {
  metadata: DeepgramMetadata
}

export function VoiceSignals({ metadata }: VoiceSignalsProps) {
  const paceOk = metadata.wordsPerMinute >= 120 && metadata.wordsPerMinute <= 150
  const fillersOk = metadata.fillerWords <= 5
  const silencesOk = metadata.longSilences <= 2

  return (
    <Card>
      <CardHeader><CardTitle>Voice Signals</CardTitle></CardHeader>
      <div className="grid grid-cols-3 gap-4">
        <Stat
          label="Speaking Pace"
          value={`${metadata.wordsPerMinute} wpm`}
          sub="Ideal: 120–150"
          ok={paceOk}
        />
        <Stat
          label="Filler Words"
          value={String(metadata.fillerWords)}
          sub="Threshold: 5"
          ok={fillersOk}
        />
        <Stat
          label="Long Silences"
          value={String(metadata.longSilences)}
          sub="> 3 seconds"
          ok={silencesOk}
        />
      </div>
    </Card>
  )
}

function Stat({ label, value, sub, ok }: { label: string; value: string; sub: string; ok: boolean }) {
  return (
    <div className="text-center">
      <p className={cn('text-3xl font-bold', ok ? 'text-green-600' : 'text-red-500')}>{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
