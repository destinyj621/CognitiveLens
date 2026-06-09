import { useRef, useState, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const submit = () => {
    const q = value.trim()
    if (!q || disabled) return
    setValue('')
    onSend(q)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="px-4 pb-5 pt-3 bg-navy-900/80 backdrop-blur-md border-t border-slate-800/50">
      <div className="max-w-3xl mx-auto">
        <div
          className={`flex items-end gap-3 rounded-2xl px-4 py-3
                      bg-slate-800/60 border transition-all duration-200
                      ${disabled
                        ? 'border-slate-700/30 opacity-70'
                        : 'border-slate-700/50 focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
                      }`}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder="Ask anything about dementia research… (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-200
                       placeholder:text-slate-600 outline-none leading-relaxed
                       disabled:cursor-not-allowed min-h-[24px]"
            style={{ scrollbarWidth: 'none' }}
          />

          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                        transition-all duration-150
                        ${disabled || !value.trim()
                          ? 'bg-slate-700/40 text-slate-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60'
                        }`}
            aria-label="Send"
          >
            {disabled
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={15} />
            }
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-2">
          Answers are grounded in PubMed abstracts · Not medical advice · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
