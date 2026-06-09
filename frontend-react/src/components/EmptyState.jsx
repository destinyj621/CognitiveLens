import { Brain, FlaskConical, Dna, ShieldCheck, HelpCircle } from 'lucide-react'
import Logo from './Logo.jsx'

const CARDS = [
  { icon: HelpCircle,   text: 'What is dementia and how does it affect the brain?',           color: 'blue' },
  { icon: Brain,        text: 'What are the early warning signs of dementia?',                color: 'cyan' },
  { icon: Dna,          text: 'Is dementia hereditary? Can it run in families?',              color: 'violet' },
  { icon: ShieldCheck,  text: 'Can dementia be prevented? What helps reduce the risk?',       color: 'emerald' },
]

const colorMap = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'text-blue-400',    hover: 'hover:border-blue-500/50 hover:bg-blue-500/15' },
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    icon: 'text-cyan-400',    hover: 'hover:border-cyan-500/50 hover:bg-cyan-500/15' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: 'text-violet-400',  hover: 'hover:border-violet-500/50 hover:bg-violet-500/15' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', hover: 'hover:border-emerald-500/50 hover:bg-emerald-500/15' },
}

export default function EmptyState({ onSelectExample }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-16 px-6 text-center animate-fade-up">

      {/* Logo hero */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl scale-150" />
        <Logo size={72} />
      </div>

      <h1 className="text-3xl font-800 gradient-text mb-2 tracking-tight">CognitiveLens</h1>
      <p className="text-slate-400 text-base mb-1">Evidence-based answers from PubMed research</p>
      <p className="text-slate-500 text-sm mb-10 max-w-md">
        Ask anything about dementia, Alzheimer's disease, or cognitive decline.
        Every answer is grounded in peer-reviewed literature.
      </p>

      {/* Example cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {CARDS.map(({ icon: Icon, text, color }) => {
          const c = colorMap[color]
          return (
            <button
              key={text}
              onClick={() => onSelectExample(text)}
              className={`flex items-start gap-3 p-4 rounded-2xl text-left
                          ${c.bg} ${c.border} ${c.hover}
                          border transition-all duration-200 group`}
            >
              <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-slate-900/60`}>
                <Icon size={15} className={c.icon} />
              </div>
              <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors leading-snug">
                {text}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-10 text-xs text-slate-600">
        Powered by Claude Opus 4 · 466 PubMed abstracts · ChromaDB semantic search
      </p>
    </div>
  )
}
