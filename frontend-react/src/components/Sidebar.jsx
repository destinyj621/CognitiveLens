import { BookOpen, FlaskConical, Brain, HelpCircle, ShieldCheck, Dna, X } from 'lucide-react'

const EXAMPLES = [
  { icon: HelpCircle,    text: 'What is dementia and how does it affect the brain?' },
  { icon: Brain,         text: 'What are the early warning signs of dementia?' },
  { icon: Dna,           text: 'Is dementia hereditary? Can it run in families?' },
  { icon: ShieldCheck,   text: 'Can dementia be prevented? What helps reduce the risk?' },
  { icon: FlaskConical,  text: "What is the difference between dementia and Alzheimer's?" },
]

export default function Sidebar({ open, onClose, onSelectExample }) {
  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-30 w-72 flex flex-col
                    bg-navy-900/95 border-r border-slate-800/60 backdrop-blur-md
                    transition-transform duration-250 ease-out
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-300
                     hover:bg-slate-800/60 transition-colors lg:hidden"
        >
          <X size={15} />
        </button>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={13} className="text-blue-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">About</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              CognitiveLens retrieves real PubMed abstracts and generates evidence-based answers
              using Claude. Every response is grounded in cited medical literature.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Papers', value: '466' },
                { label: 'Chunks', value: '2.2K' },
                { label: 'Topics', value: '10' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-slate-800/50 border border-slate-700/40 p-2 text-center">
                  <div className="text-sm font-semibold gradient-text">{value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Example questions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} className="text-cyan-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Try asking</span>
            </div>
            <div className="space-y-2">
              {EXAMPLES.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => onSelectExample(text)}
                  className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl
                             text-xs text-slate-300 leading-relaxed
                             bg-slate-800/30 hover:bg-slate-700/50
                             border border-slate-700/30 hover:border-slate-600/50
                             transition-all duration-150 group"
                >
                  <Icon size={13} className="mt-0.5 flex-shrink-0 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tech stack pill list */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical size={13} className="text-purple-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Stack</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['PubMed', 'ChromaDB', 'Sentence Transformers', 'LangChain', 'Claude Opus 4', 'FastAPI'].map(t => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-600 text-center">
            For informational purposes only · Not medical advice
          </p>
        </div>
      </aside>
    </>
  )
}
