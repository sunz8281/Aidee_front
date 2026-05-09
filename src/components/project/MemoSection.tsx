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
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #004fff',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
        }}
      >
        {/* Content + save icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') handleCancel() }}
            style={{
              flex: 1,
              fontSize: 13,
              color: '#364153',
              lineHeight: '1.6',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              padding: 0,
              fontFamily: 'inherit',
              minHeight: 60,
            }}
          />
          <button
            onClick={handleSave}
            disabled={update.isPending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            <IconCheck width={18} height={18} className="text-primary" />
          </button>
        </div>

        {/* Meeting selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span style={{ fontSize: 10, color: '#929292' }}>▾</span>
            <span style={{ fontSize: 12, color: '#929292' }}>
              {selectedMeeting?.title ?? memo.meetingTitle}
            </span>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                right: 0,
                background: '#ffffff',
                border: '1px solid #dedede',
                borderRadius: 8,
                zIndex: 100,
                overflow: 'hidden',
                minWidth: 120,
                maxHeight: 160,
                overflowY: 'auto',
              }}
            >
              <div
                onMouseDown={e => e.stopPropagation()}
                onClick={() => { setSelectedMeetingId(null); setDropdownOpen(false) }}
                style={{
                  padding: '6px 8px',
                  fontSize: 12,
                  color: '#808080',
                  cursor: 'pointer',
                  background: selectedMeetingId === null ? '#c7d8ff' : '#ffffff',
                  whiteSpace: 'nowrap',
                }}
              >
                선택안함
              </div>
              {meetings.map(m => (
                <div
                  key={m.id}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => { setSelectedMeetingId(m.id); setDropdownOpen(false) }}
                  style={{
                    padding: '6px 8px',
                    fontSize: 12,
                    color: '#000000',
                    cursor: 'pointer',
                    background: m.id === selectedMeetingId ? '#c7d8ff' : '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
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
    <div
      style={{
        background: '#FFFDE7',
        border: '1px solid #FFF176',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 20,
        minHeight: 100,
      }}
    >
      {/* Content + edit icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, color: '#364153', lineHeight: '1.6', whiteSpace: 'pre-line', flex: 1 }}>
          {memo.memo}
        </div>
        <button
          onClick={() => setEditing(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <IconEdit width={18} height={18} style={{ color: '#929292' }} />
        </button>
      </div>

      {/* Meeting name */}
      <div style={{ fontSize: 12, color: '#929292', textAlign: 'right' }}>
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      {memos.map((memo, i) => (
        <MemoCard key={`${memo.meetingId}-${i}`} memo={memo} meetings={meetings} />
      ))}
    </div>
  )
}
