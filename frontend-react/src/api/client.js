const API_BASE = 'http://localhost:8000'

export const streamChat = async (question, history, onToken, onComplete, onError) => {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(err.detail || 'Request failed')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6))
          if (event.type === 'delta') onToken(event.text)
          else if (event.type === 'done') onComplete(event.sources)
          else if (event.type === 'error') throw new Error(event.message)
        } catch {
          // skip malformed events
        }
      }
    }
  } catch (err) {
    onError(err.message)
  }
}

export const runEvaluation = async (question, answer, contexts) => {
  const response = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer, contexts }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Evaluation failed' }))
    throw new Error(err.detail || 'Evaluation failed')
  }
  return response.json()
}

export const checkHealth = () =>
  fetch(`${API_BASE}/health`).then(r => r.json()).catch(() => ({ status: 'offline' }))
