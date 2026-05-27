'use client'

import { useRef, useEffect } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { IconX, IconSend, IconAgent } from '@/components/icons'
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        credentials: 'include',
        body: JSON.stringify({ message: text, history: messages }),
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

  const hasMessages = messages.length > 0

  return (
    <div className="fixed inset-0 z-40 flex flex-col">
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
          hasMessages
            ? 'bg-gradient-to-b from-black/50 to-black/60'
            : 'bg-gradient-to-b from-transparent to-black/25'
        }`}
      />

      {/* Messages area */}
      <div className="relative flex-1 overflow-y-auto px-[35px] pt-[39px] pb-4 flex flex-col gap-[13px]">
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="bg-primary text-white px-[21px] py-[13px] rounded-bl-[8px] rounded-tl-[8px] rounded-tr-[8px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] text-[16px] tracking-[-0.31px] max-w-[60%] whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-[22px] items-end">
              <div className="shrink-0">
                <IconAgent width={52} height={52} />
              </div>
              <div className="bg-white text-black px-[21px] py-[13px] rounded-br-[8px] rounded-tl-[8px] rounded-tr-[8px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] text-[16px] tracking-[-0.31px] max-w-[60%] whitespace-pre-wrap">
                {msg.content}
                {isStreaming && i === messages.length - 1 && (
                  <span className="inline-block w-[2px] h-[1.2em] bg-black align-middle ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="relative pb-6 px-10 shrink-0">
        <div className="flex items-center gap-[13px]">
          {/* Close button */}
          <button
            onClick={close}
            className="w-[46px] h-[46px] bg-card rounded-full shrink-0 flex items-center justify-center shadow-[0px_3px_22px_rgba(0,0,0,0.25)] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <IconX width={20} height={20} className="text-text-primary" />
          </button>

          {/* Input */}
          <div className="flex-1 bg-card rounded-[32px] h-[63px] flex items-center px-[38px] overflow-hidden min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="에이전트에게 물어보세요"
              disabled={isStreaming}
              className="flex-1 border-none outline-none text-[20px] text-[#979797] bg-transparent tracking-[-0.44px] disabled:opacity-60"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isStreaming}
            className="w-[63px] h-[63px] bg-primary rounded-full shrink-0 flex items-center justify-center shadow-[0px_4px_30px_rgba(0,0,0,0.25)] disabled:opacity-50 hover:opacity-85 transition-opacity cursor-pointer"
          >
            <IconSend width={28} height={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
