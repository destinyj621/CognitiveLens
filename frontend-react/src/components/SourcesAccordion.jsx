import { useState } from 'react'
import { ChevronDown, ExternalLink, BookOpen } from 'lucide-react'

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.75 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
              : score >= 0.5  ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
              :                  'text-slate-400  bg-slate-500/10  border-slate-500/25'
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${color}`}>
      {pct}% match
    </span>
  )
}

export default function SourcesAccordion({ sources }) {
  const [open, setOpen] = useState(false)

  if (!sources?.length) return null

  return (
    <div className="mt-3 rounded-xl border border-slate-700/40 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5
                   bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <BookOpen size={12} className="text-blue-400" />
          <span className="font-medium">{sources.length} retrieved sources</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Source list */}
      {open && (
        <div className="divide-y divide-slate-800/50">
          {sources.map((src, i) => (
            <div key={src.pmid || i} className="px-3.5 py-3 bg-slate-900/30 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20
                                     px-1.5 py-0.5 rounded-md flex-shrink-0">
                      [{i + 1}]
                    </span>
                    <ScoreBadge score={src.score} />
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-snug line-clamp-2">
                    {src.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {src.authors && <span>{src.authors} · </span>}
                    {src.journal && <span className="italic">{src.journal}</span>}
                    {src.year && <span> · {src.year}</span>}
                    {src.pmid && <span> · PMID {src.pmid}</span>}
                  </p>
                </div>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-blue-400
                               hover:bg-blue-500/10 transition-colors"
                    title="View on PubMed"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
