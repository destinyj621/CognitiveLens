import { PanelLeft, Plus, Github } from 'lucide-react'
import Logo from './Logo.jsx'

export default function Header({ onNewChat, onToggleSidebar, sidebarOpen }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3
                        bg-navy-900/90 backdrop-blur-md border-b border-slate-800/60">

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={18} />
      </button>

      {/* Logo + wordmark */}
      <div className="flex items-center gap-2.5 select-none">
        <Logo size={30} />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-700 gradient-text tracking-tight">CognitiveLens</span>
          <span className="text-[10px] text-slate-500 tracking-wide">Dementia Research AI</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-slate-800 mx-1" />

      {/* Status pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] text-slate-400 font-medium">466 papers indexed</span>
      </div>

      <div className="flex-1" />

      {/* GitHub */}
      <a
        href="https://github.com/destinyj621/CognitiveLens"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        aria-label="GitHub"
      >
        <Github size={17} />
      </a>

      {/* New chat */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                   bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 hover:border-blue-500/60
                   text-blue-300 hover:text-blue-200 transition-all duration-150"
      >
        <Plus size={14} />
        New chat
      </button>
    </header>
  )
}
