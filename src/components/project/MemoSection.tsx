'use client'

import { useState, useEffect } from 'react'
import type { Memo } from '@/types'
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

  return (
    <div
      style={{
        background: '#FFFDE7',
        border: '1px solid #FFF176',
        borderRadius: 8,
        padding: '12px 14px',
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Memo text */}
      <div style={{ flex: 1 }}>
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setDraft(memo.memo); setEditing(false) }
            }}
            style={{
              width: '100%',
              minHeight: 60,
              fontSize: 13,
              color: '#1A1A1A',
              lineHeight: '20px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              padding: 0,
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: '20px', whiteSpace: 'pre-line' }}>
            {memo.memo}
          </div>
        )}
      </div>

      {/* Bottom: meeting name + edit/save button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 11, color: '#9E9E9E' }}>{memo.meetingTitle}</span>
        {editing ? (
          <button
            onClick={handleSave}
            disabled={update.isPending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <IconCheck width={14} height={14} className="text-primary" />
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <IconEdit width={14} height={14} style={{ color: '#9E9E9E' }} />
          </button>
        )}
      </div>
    </div>
  )
}

interface MemoSectionProps {
  memos: Memo[]
}

export function MemoSection({ memos }: MemoSectionProps) {
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
        <MemoCard key={`${memo.meetingId}-${i}`} memo={memo} />
      ))}
    </div>
  )
}
