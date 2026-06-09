import { useState, useCallback, useRef, useEffect } from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatArea from './components/ChatArea.jsx'
import ChatInput from './components/ChatInput.jsx'
import EvaluationDrawer from './components/EvaluationDrawer.jsx'
import { streamChat, runEvaluation } from './api/client.js'

let msgCounter = 0
const uid = () => ++msgCounter

export default function App() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [evalDrawer, setEvalDrawer] = useState({
    open: false,
    loading: false,
    scores: null,
    question: null,
  })

  // Inject an example question into the input via a ref callback
  const injectRef = useRef(null)
  const [injectedQuestion, setInjectedQuestion] = useState(null)

  const sendMessage = useCallback(async (question) => {
    if (!question.trim() || isStreaming) return

    const userMsg = {
      id: uid(),
      role: 'user',
      content: question,
      timestamp: Date.now(),
    }

    const assistantId = uid()
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      isStreaming: true,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsStreaming(true)

    // History = all prior messages (not the ones just added)
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    await streamChat(
      question,
      history,
      // onToken
      (token) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: m.content + token } : m)
        )
      },
      // onComplete
      (sources) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, sources, isStreaming: false } : m
          )
        )
        setIsStreaming(false)
      },
      // onError
      (error) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: `Sorry, something went wrong: ${error}`, isStreaming: false }
              : m
          )
        )
        setIsStreaming(false)
      },
    )
  }, [messages, isStreaming])

  const handleEvaluate = useCallback(async (message) => {
    setEvalDrawer({ open: true, loading: true, scores: null, question: message.question || null })

    // Find the user message just before this assistant message
    const idx = messages.findIndex(m => m.id === message.id)
    const preceding = idx > 0 ? messages[idx - 1] : null
    const question = preceding?.role === 'user' ? preceding.content : ''

    setEvalDrawer(d => ({ ...d, question }))

    try {
      const contexts = (message.sources || []).map(s => s.text || s.title)
      const scores = await runEvaluation(question, message.content, contexts)
      setEvalDrawer(d => ({ ...d, loading: false, scores }))
    } catch (err) {
      setEvalDrawer(d => ({ ...d, loading: false, scores: null }))
      console.error('Evaluation error:', err)
    }
  }, [messages])

  const handleSelectExample = useCallback((text) => {
    setInjectedQuestion(text)
  }, [])

  // When example is selected, send it directly
  useEffect(() => {
    if (injectedQuestion) {
      sendMessage(injectedQuestion)
      setInjectedQuestion(null)
    }
  }, [injectedQuestion, sendMessage])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setEvalDrawer({ open: false, loading: false, scores: null, question: null })
    setIsStreaming(false)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-navy-900 overflow-hidden">

      <Header
        onNewChat={handleNewChat}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden pt-14">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectExample={handleSelectExample}
        />

        {/* Main content — offset when sidebar is open on desktop */}
        <main
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-250
                      ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}
        >
          <ChatArea
            messages={messages}
            onEvaluate={handleEvaluate}
            onSelectExample={handleSelectExample}
          />

          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
          />
        </main>
      </div>

      <EvaluationDrawer
        open={evalDrawer.open}
        onClose={() => setEvalDrawer(d => ({ ...d, open: false }))}
        scores={evalDrawer.scores}
        loading={evalDrawer.loading}
        question={evalDrawer.question}
      />
    </div>
  )
}
