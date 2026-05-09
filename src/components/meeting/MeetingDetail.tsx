'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { IconChat, IconPlay, IconMemo, IconCalendar } from '@/components/icons'
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
  const [titleDraft, setTitleDraft] = useState(meeting.title)
  const [dateDraft, setDateDraft] = useState(
    (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
  )
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
  }

  const handleDateSave = async (value: string) => {
    setDateDraft(value)
    if (value) {
      await updateMeeting.mutateAsync({ meetingAt: `${value}T00:00:00` })
    }
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

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* Title card */}
      <div
        style={{
          background: '#ffffff',
          border: '2px solid #004fff',
          borderRadius: 10,
          padding: '20px 25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <input
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          style={{
            flex: 1,
            fontSize: 26,
            fontWeight: 700,
            color: '#0a0a0a',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
          }}
        />
        <input
          type="date"
          value={dateDraft}
          onChange={e => handleDateSave(e.target.value)}
          style={{
            fontSize: 15,
            color: '#4a5565',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        />
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
            <IconChat width={16} height={16} className="text-primary" />
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
            <IconPlay width={14} height={14} />
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
              <IconMemo width={14} height={14} />
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
                <IconCalendar width={14} height={14} />
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
