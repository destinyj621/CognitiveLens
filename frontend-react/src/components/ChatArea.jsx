import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage.jsx'
import EmptyState from './EmptyState.jsx'

export default function ChatArea({ messages, onEvaluate, onSelectExample }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto dot-grid">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4 min-h-full flex flex-col">
        {messages.length === 0 ? (
          <EmptyState onSelectExample={onSelectExample} />
        ) : (
          <div className="flex-1">
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onEvaluate={onEvaluate}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
