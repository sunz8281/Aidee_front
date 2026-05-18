'use client'

import { useState, useEffect } from 'react'
import type { Memo, MeetingSummary } from '@/types'
import { IconEdit, IconCheck } from '@/components/icons'
import { useUpdateMemo } from '@/hooks/useMemos'

interface MemoCardProps {
  memo: Memo
}

function MemoCard({ memo }: MemoCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(memo.memo)
  const update = useUpdateMemo(memo.meetingId)

  useEffect(() => {
    setDraft(memo.memo)
  }, [memo.memo])

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
      <div className="bg-card border border-primary rounded-[10px] px-[14px] py-3 flex flex-col gap-2.5 relative">
        {/* Content + save icon */}
        <div className="flex items-start justify-between gap-2">
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') handleCancel() }}
            className="flex-1 text-base text-body leading-relaxed border-none outline-none bg-transparent resize-none p-0 min-h-[60px] font-[inherit]"
          />
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="bg-transparent border-none cursor-pointer p-0 shrink-0"
          >
            <IconCheck width={18} height={18} className="text-primary" />
          </button>
        </div>

        {/* Meeting name (read-only while editing) */}
        <div className="text-sm text-[#929292] text-right">
          {memo.meetingTitle}
        </div>
      </div>
    )
  }

  /* ── VIEW MODE ── */
  return (
    <div className="bg-memo-card border border-memo-card-border rounded-[10px] px-[14px] py-3 flex flex-col justify-between gap-5 min-h-[100px]">
      {/* Content + edit icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-base text-body leading-relaxed whitespace-pre-line flex-1">
          {memo.memo}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="bg-transparent border-none cursor-pointer p-0 shrink-0"
        >
          <IconEdit width={18} height={18} className="text-[#929292]" />
        </button>
      </div>

      {/* Meeting name */}
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
