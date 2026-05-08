'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Meeting, Schedule } from '@/types'
import { useUpdateMeeting } from '@/hooks/useMeetings'
import { useUpdateMemo } from '@/hooks/useMemos'
import { QUERY_KEYS } from '@/constants/queryKeys'

interface MeetingDetailProps {
  meeting: Meeting
  projectId: string
}

function formatSeconds(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export function MeetingDetail({ meeting, projectId }: MeetingDetailProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(meeting.title)
  const [memoDraft, setMemoDraft] = useState(meeting.memo ?? '')
  const [memoSaveTimeout, setMemoSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const updateMeeting = useUpdateMeeting(meeting.id)
  const updateMemo = useUpdateMemo(meeting.id)
  const qc = useQueryClient()

  const handleTitleSave = async () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== meeting.title) {
      await updateMeeting.mutateAsync({ title: trimmed })
    }
    setIsEditingTitle(false)
  }

  const handleMemoChange = (value: string) => {
    setMemoDraft(value)
    if (memoSaveTimeout) clearTimeout(memoSaveTimeout)
    const t = setTimeout(() => {
      updateMemo.mutate(value)
    }, 800)
    setMemoSaveTimeout(t)
  }

  const handleMemoBlur = () => {
    if (memoSaveTimeout) clearTimeout(memoSaveTimeout)
    updateMemo.mutate(memoDraft)
  }

  const meetingDate = meeting.meetingAt
    ? new Date(meeting.meetingAt).toLocaleDateString('ko-KR')
    : new Date(meeting.createdAt).toLocaleDateString('ko-KR')

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* Title row */}
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <div className="flex items-center gap-2" style={{ flex: 1 }}>
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') setIsEditingTitle(false)
              }}
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#1A1A1A',
                border: 'none',
                borderBottom: '2px solid #3B5BDB',
                outline: 'none',
                background: 'transparent',
                flex: 1,
              }}
            />
          ) : (
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              {meeting.title}
            </h1>
          )}
          <button
            onClick={() => {
              setTitleDraft(meeting.title)
              setIsEditingTitle(true)
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9E9E9E',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <span style={{ fontSize: 13, color: '#9E9E9E', flexShrink: 0 }}>{meetingDate}</span>
      </div>

      {/* Summary */}
      {meeting.summary && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #E5E5E5',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                fill="#3B5BDB"
              />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>회의 요약</span>
          </div>
          <p style={{ fontSize: 14, color: '#1A1A1A', lineHeight: '22px', margin: 0 }}>
            {meeting.summary}
          </p>
        </div>
      )}

      {/* Script + Memo/Schedules */}
      <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>
        {/* Script */}
        <div
          style={{
            flex: 1,
            background: '#ffffff',
            border: '1px solid #E5E5E5',
            borderRadius: 12,
            padding: 20,
            minHeight: 300,
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#3B5BDB">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>회의 스크립트</span>
          </div>
          {meeting.scripts && meeting.scripts.length > 0 ? (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {meeting.scripts.map((seg, i) => (
                <div
                  key={i}
                  className="flex gap-3"
                  style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #F8F8F8' }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9E9E9E',
                      minWidth: 36,
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    {formatSeconds(seg.startTime)}
                  </span>
                  <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: '20px', margin: 0 }}>
                    {seg.contents}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#9E9E9E', fontSize: 13 }}>스크립트가 없습니다.</div>
          )}
        </div>

        {/* Right column */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Memo */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #E5E5E5',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#F59E0B" strokeWidth="2" />
                <path d="M8 8h8M8 12h8M8 16h5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>회의 메모</span>
            </div>
            <textarea
              value={memoDraft}
              onChange={e => handleMemoChange(e.target.value)}
              onBlur={handleMemoBlur}
              placeholder="회의 메모를 입력하세요..."
              style={{
                width: '100%',
                minHeight: 100,
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontSize: 13,
                color: '#1A1A1A',
                lineHeight: '20px',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Schedules */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #E5E5E5',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#10B981" strokeWidth="2" />
                  <line x1="16" y1="2" x2="16" y2="6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="2" x2="8" y2="6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="21" y2="10" stroke="#10B981" strokeWidth="2" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>정해진 일정</span>
              </div>
            </div>
            {meeting.schedules && meeting.schedules.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {meeting.schedules.map((s: Schedule) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between"
                    style={{
                      background: '#F0FDF4',
                      borderRadius: 6,
                      padding: '6px 10px',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#1A1A1A', fontWeight: 500 }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: 11, color: '#9E9E9E' }}>
                      {new Date(s.startTime).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#9E9E9E', fontSize: 12 }}>추출된 일정이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
