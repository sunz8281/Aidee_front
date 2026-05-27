'use client'

import { useState, useEffect, useRef } from 'react'
import type { Memo, MeetingSummary } from '@/types'
import { IconEdit, IconCheck } from '@/components/icons'
import { useUpdateMemo } from '@/hooks/useMemos'

const URL_REGEX = /https?:\/\/[^\s]+/g

function renderWithLinks(text: string) {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  URL_REGEX.lastIndex = 0

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    nodes.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline break-all"
        onClick={e => e.stopPropagation()}
      >
        {match[0]}
      </a>
    )
    lastIndex = URL_REGEX.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

interface MemoCardProps {
  memo: Memo
}

function MemoCard({ memo }: MemoCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(memo.memo)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const update = useUpdateMemo(memo.meetingId)

  useEffect(() => {
    setDraft(memo.memo)
  }, [memo.memo])

  // 편집 모드 진입 시 텍스트 내용에 맞게 textarea 높이 설정
  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [editing])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleSave = async () => {
    await update.mutateAsync(draft)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(memo.memo)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-card border border-primary rounded-[10px] px-[14px] py-3 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <textarea
            ref={textareaRef}
            autoFocus
            value={draft}
            onChange={handleChange}
            onKeyDown={e => { if (e.key === 'Escape') handleCancel() }}
            className="flex-1 text-base text-body leading-relaxed border-none outline-none bg-transparent resize-none p-0 font-[inherit] overflow-hidden"
          />
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="bg-transparent border-none cursor-pointer p-0 shrink-0"
          >
            <IconCheck width={18} height={18} className="text-primary" />
          </button>
        </div>
        <div className="text-sm text-[#929292] text-right">
          {memo.meetingTitle}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-memo-card border border-memo-card-border rounded-[10px] px-[14px] py-3 flex flex-col justify-between gap-5 min-h-[100px] overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="text-base text-body leading-relaxed whitespace-pre-line break-words flex-1 min-w-0">
          {renderWithLinks(memo.memo ?? '')}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="bg-transparent border-none cursor-pointer p-0 shrink-0"
        >
          <IconEdit width={18} height={18} className="text-[#929292]" />
        </button>
      </div>
      <div className="text-sm text-[#929292] text-right">
        {memo.meetingTitle}
      </div>
    </div>
  )
}

interface MemoSectionProps {
  memos: Memo[]
  meetings: MeetingSummary[]
}

export function MemoSection({ memos }: MemoSectionProps) {
  if (memos.length === 0) return null

  return (
    <div className="grid grid-cols-4 gap-3">
      {memos.map((memo, i) => (
        <MemoCard key={`${memo.meetingId}-${i}`} memo={memo} />
      ))}
    </div>
  )
}
