'use client'

import { useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { IconSend } from '@/components/icons'
import { useAgentStore } from '@/store/agentStore'
import type { AgentActionPayload } from '@/types'

interface AgentBarProps {
  projectId: string
  meetingId?: string
  onAction?: (action: AgentActionPayload) => void
}

export function AgentBar({ projectId, meetingId, onAction }: AgentBarProps) {
  const {
    isOpen,
    close,
    inputText,
    setInputText,
    messages,
    addMessage,
    appendToLastAssistant,
    isStreaming,
    setStreaming,
  } = useAgentStore()

  const abortRef = useRef<AbortController | null>(null)

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || isStreaming) return

    addMessage({ role: 'user', content: text })
    setInputText('')
    setStreaming(true)

    abortRef.current = new AbortController()

    const url = `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/agent${
      meetingId ? `?meetingId=${meetingId}` : ''
    }`

    try {
      await fetchEventSource(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
        signal: abortRef.current.signal,
        onmessage(ev) {
          if (ev.event === 'delta') {
            const data = JSON.parse(ev.data) as { text: string }
            appendToLastAssistant(data.text)
          } else if (ev.event === 'action') {
            const data = JSON.parse(ev.data) as AgentActionPayload
            onAction?.(data)
          } else if (ev.event === 'done') {
            setStreaming(false)
          }
        },
        onerror(err) {
          setStreaming(false)
          throw err
        },
      })
    } catch {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/[0.04] z-40 pb-4">
      <div className="flex items-center gap-3 max-w-[760px] mx-auto bg-card border border-border rounded-full px-5 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
        {/* Close */}
        <button
          onClick={close}
          className="w-8 h-8 rounded-full border border-border bg-card cursor-pointer flex items-center justify-center text-base text-text-secondary shrink-0"
        >
          ×
        </button>

        {/* Input */}
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="에이전트에게 물어보세요"
          disabled={isStreaming}
          className="flex-1 border-none outline-none text-md text-text-primary bg-transparent"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isStreaming}
          className={[
            'w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center shrink-0 transition-colors',
            inputText.trim() ? 'bg-primary' : 'bg-border cursor-default',
          ].join(' ')}
        >
          <IconSend width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
