'use client'

import type { Memo } from '@/types'
import { IconMemo } from '@/components/icons'

interface MemoSectionProps {
  memos: Memo[]
}

export function MemoSection({ memos }: MemoSectionProps) {
  if (memos.length === 0) return null

  return (
    <div>
      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {memos.map((memo, i) => (
          <div
            key={`${memo.meetingId}-${i}`}
            style={{
              background: '#FFFDE7',
              border: '1px solid #FFF176',
              borderRadius: 8,
              padding: '12px 14px',
              minHeight: 100,
              fontSize: 13,
              color: '#1A1A1A',
              lineHeight: '20px',
              position: 'relative',
            }}
          >
            <div style={{ whiteSpace: 'pre-line' }}>{memo.memo}</div>
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: '#9E9E9E',
                textAlign: 'right',
              }}
            >
              {memo.meetingTitle}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
