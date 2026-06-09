import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, BarChart2, Brain } from 'lucide-react'
import SourcesAccordion from './SourcesAccordion.jsx'
import Logo from './Logo.jsx'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="typing-dot w-2 h-2 rounded-full bg-blue-400/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
      title="Copy answer"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function ChatMessage({ message, onEvaluate }) {
  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming
  const isEmpty = isStreaming && !message.content

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 animate-fade-up">
        <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm
                        bg-gradient-to-br from-blue-600 to-blue-700 text-white
                        text-sm leading-relaxed shadow-lg shadow-blue-900/30">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 mb-6 animate-fade-up">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/50
                      flex items-center justify-center mt-0.5">
        <Logo size={20} />
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3.5">

          {isEmpty ? (
            <TypingIndicator />
          ) : (
            <>
              {/* Markdown content */}
              <div className="prose prose-sm max-w-none text-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {isStreaming && <span className="streaming-cursor" />}
              </div>

              {/* Actions + sources (only after streaming is done) */}
              {!isStreaming && (
                <>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-700/30">
                    <CopyButton text={message.content} />
                    {message.sources?.length > 0 && onEvaluate && (
                      <button
                        onClick={() => onEvaluate(message)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                                   text-slate-500 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                        title="Evaluate this answer"
                      >
                        <BarChart2 size={12} />
                        Evaluate
                      </button>
                    )}
                    <span className="ml-auto text-[10px] text-slate-600">
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <SourcesAccordion sources={message.sources} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
