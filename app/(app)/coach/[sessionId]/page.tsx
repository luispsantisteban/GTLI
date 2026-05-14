import { CoachChatPanel } from '@/src/components/coach/CoachChatPanel'
import { Button } from '@/src/components/ui/Button'
import Link from 'next/link'

interface Props {
  params: { sessionId: string }
}

export default function CoachChatPage({ params }: Props) {
  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coach Chat</h1>
          <p className="text-sm text-gray-500">Get personalized advice about your session</p>
        </div>
        <Link href={`/feedback/${params.sessionId}`}>
          <Button variant="secondary" size="sm">← Back to Feedback</Button>
        </Link>
      </div>
      <div className="flex-1 min-h-0">
        <CoachChatPanel sessionId={params.sessionId} />
      </div>
    </div>
  )
}
