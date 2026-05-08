'use client'

import { useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
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
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.04)',
        zIndex: 40,
        padding: '0 0 16px',
      }}
    >
      <div
        className="flex items-center gap-3"
        style={{
          maxWidth: 760,
          margin: '0 auto',
          background: '#ffffff',
          border: '1px solid #E5E5E5',
          borderRadius: 32,
          padding: '8px 8px 8px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        {/* Close */}
        <button
          onClick={close}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid #E5E5E5',
            background: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: '#6B6B6B',
            flexShrink: 0,
          }}
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
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: '#1A1A1A',
            background: 'transparent',
          }}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isStreaming}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: inputText.trim() ? '#3B5BDB' : '#E5E5E5',
            border: 'none',
            cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
