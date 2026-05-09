'use client'

import { useState, useEffect } from 'react'
import type { Memo, MeetingSummary } from '@/types'
import { IconEdit, IconCheck } from '@/components/icons'
import { useUpdateMemo } from '@/hooks/useMemos'

interface MemoCardProps {
  memo: Memo
  meetings: MeetingSummary[]
}

function MemoCard({ memo, meetings }: MemoCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(memo.memo)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(memo.meetingId ?? null)
  const update = useUpdateMemo(memo.meetingId)

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId)

  useEffect(() => {
    setDraft(memo.memo)
  }, [memo.memo])

  const handleSave = async () => {
    await update.mutateAsync(draft)
    setEditing(false)
    setDropdownOpen(false)
  }

  const handleCancel = () => {
    setDraft(memo.memo)
    setSelectedMeetingId(memo.meetingId ?? null)
    setEditing(false)
    setDropdownOpen(false)
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

        {/* Meeting selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center justify-end gap-1 w-full bg-transparent border-none cursor-pointer p-0"
          >
            <span className="text-xs text-[#929292]">▾</span>
            <span className="text-sm text-[#929292]">
              {selectedMeeting?.title ?? memo.meetingTitle}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-[calc(100%+4px)] right-0 bg-card border border-[#dedede] rounded-md z-[100] overflow-hidden min-w-[120px] max-h-[160px] overflow-y-auto">
              <div
                onMouseDown={e => e.stopPropagation()}
                onClick={() => { setSelectedMeetingId(null); setDropdownOpen(false) }}
                className={['px-2 py-1.5 text-sm text-text-secondary cursor-pointer whitespace-nowrap', selectedMeetingId === null ? 'bg-dropdown-selected' : 'bg-card'].join(' ')}
              >
                선택안함
              </div>
              {meetings.map(m => (
                <div
                  key={m.id}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => { setSelectedMeetingId(m.id); setDropdownOpen(false) }}
                  className={['px-2 py-1.5 text-sm text-title cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis', m.id === selectedMeetingId ? 'bg-dropdown-selected' : 'bg-card'].join(' ')}
                >
                  {m.title}
                </div>
              ))}
            </div>
          )}
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

export function MemoSection({ memos, meetings }: MemoSectionProps) {
  if (memos.length === 0) return null

  return (
    <div className="grid grid-cols-4 gap-3">
      {memos.map((memo, i) => (
        <MemoCard key={`${memo.meetingId}-${i}`} memo={memo} meetings={meetings} />
      ))}
    </div>
  )
}
