import { X, BarChart2, Loader2 } from 'lucide-react'

function ScoreRing({ value, label, color, description }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - (value ?? 0))
  const pct = Math.round((value ?? 0) * 100)

  const strokeColor =
    value >= 0.8 ? '#34d399'
    : value >= 0.55 ? '#fbbf24'
    : '#f87171'

  const textColor =
    value >= 0.8 ? 'text-emerald-400'
    : value >= 0.55 ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80">
          {/* Background track */}
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          {/* Score arc */}
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="score-ring"
            style={{ filter: `drop-shadow(0 0 6px ${strokeColor}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-700 ${textColor}`}>{pct}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        <div className="text-[10px] text-slate-500 mt-0.5 max-w-[90px] leading-tight">{description}</div>
      </div>
    </div>
  )
}

export default function EvaluationDrawer({ open, onClose, scores, loading, question }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-14 right-0 bottom-0 z-50 w-80 flex flex-col
                    bg-navy-800/98 backdrop-blur-xl border-l border-slate-800/70
                    transition-transform duration-300 ease-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-slate-200">Answer Evaluation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Question */}
          {question && (
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Question evaluated</p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{question}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="text-violet-400 animate-spin" />
              <p className="text-xs text-slate-400 text-center">
                Claude Haiku is evaluating<br />faithfulness, relevance, and precision…
              </p>
            </div>
          )}

          {/* Scores */}
          {!loading && scores && (
            <>
              <div className="flex justify-around py-4">
                <ScoreRing
                  value={scores.faithfulness}
                  label="Faithfulness"
                  description="Grounded in sources"
                />
                <ScoreRing
                  value={scores.answer_relevance}
                  label="Relevance"
                  description="Addresses the question"
                />
                <ScoreRing
                  value={scores.context_precision}
                  label="Precision"
                  description="Useful chunks retrieved"
                />
              </div>

              {/* Reasoning */}
              {scores.reasoning && (
                <div className="rounded-xl bg-violet-500/8 border border-violet-500/20 p-3.5">
                  <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1.5">
                    Evaluation note
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{scores.reasoning}</p>
                </div>
              )}

              {/* Legend */}
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-3.5 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Score guide</p>
                {[
                  { color: 'bg-emerald-400', label: '80–100 · Strong' },
                  { color: 'bg-yellow-400',  label: '55–79  · Acceptable' },
                  { color: 'bg-red-400',     label: '0–54   · Needs improvement' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                    <span className="text-[11px] text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty */}
          {!loading && !scores && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <BarChart2 size={32} className="text-slate-700" />
              <p className="text-sm text-slate-500">Click "Evaluate" on any<br />assistant message to score it.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
