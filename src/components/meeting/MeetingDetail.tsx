'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { IconEdit, IconCheck, IconChat, IconPlay, IconMemo, IconCalendar } from '@/components/icons'
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
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(meeting.title)
  const [dateDraft, setDateDraft] = useState(
    (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
  )
  const [memoDraft, setMemoDraft] = useState(meeting.memo ?? '')
  const [memoSaveTimeout, setMemoSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const updateMeeting = useUpdateMeeting(meeting.id)
  const updateMemo = useUpdateMemo(meeting.id)
  const qc = useQueryClient()

  const handleEditStart = () => {
    setTitleDraft(meeting.title)
    setDateDraft((meeting.meetingAt ?? meeting.createdAt).slice(0, 10))
    setIsEditing(true)
  }

  const handleEditSave = async () => {
    const trimmed = titleDraft.trim()
    const updates: { title?: string; meetingAt?: string } = {}
    if (trimmed && trimmed !== meeting.title) updates.title = trimmed
    if (dateDraft && dateDraft !== (meeting.meetingAt ?? meeting.createdAt).slice(0, 10))
      updates.meetingAt = `${dateDraft}T00:00:00`
    if (Object.keys(updates).length > 0) {
      await updateMeeting.mutateAsync(updates)
    }
    setIsEditing(false)
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

  const displayDate = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 25,
  }

  const sectionHeadingStyle = {
    fontSize: 18,
    fontWeight: 600,
    color: '#0a0a0a',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>

      {/* ── Header card ── */}
      {isEditing ? (
        <div
          style={{
            ...cardStyle,
            border: '2px solid #004fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEditSave() }}
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
            onChange={e => setDateDraft(e.target.value)}
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
          <button
            onClick={handleEditSave}
            disabled={updateMeeting.isPending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            <IconCheck width={20} height={20} className="text-primary" />
          </button>
        </div>
      ) : (
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#0a0a0a', margin: 0, letterSpacing: '0.4px' }}>
              {meeting.title}
            </h1>
            <button
              onClick={handleEditStart}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <IconEdit width={20} height={20} style={{ color: '#9e9e9e' }} />
            </button>
          </div>
          <span style={{ fontSize: 16, color: '#4a5565', letterSpacing: '-0.31px', flexShrink: 0 }}>
            {displayDate}
          </span>
        </div>
      )}

      {/* ── Summary ── */}
      {meeting.summary && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <IconChat width={20} height={20} className="text-primary" />
            <span style={sectionHeadingStyle}>회의 요약</span>
          </div>
          <p style={{ fontSize: 16, color: '#364153', lineHeight: '26px', margin: 0, letterSpacing: '-0.31px' }}>
            {meeting.summary}
          </p>
        </div>
      )}

      {/* ── Script + Right column ── */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* Script */}
        <div style={{ ...cardStyle, flex: 1, minWidth: 0, padding: '25px 25px 1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <IconPlay width={20} height={20} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#0a0a0a', letterSpacing: '-0.45px' }}>
              회의 스크립트
            </span>
          </div>
          {meeting.scripts && meeting.scripts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxHeight: 600, overflowY: 'auto', paddingBottom: 24 }}>
              {meeting.scripts.map((seg, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, color: '#e5e5e8', minWidth: 48, flexShrink: 0, letterSpacing: '-0.15px' }}>
                    {formatSeconds(seg.startTime)}
                  </span>
                  <p style={{ fontSize: 16, color: '#364153', lineHeight: '24px', margin: 0, letterSpacing: '-0.31px' }}>
                    {seg.contents}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#9E9E9E', fontSize: 14, paddingBottom: 24 }}>스크립트가 없습니다.</div>
          )}
        </div>

        {/* Right column */}
        <div style={{ width: 319, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Memo */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <IconMemo width={20} height={20} />
              <span style={sectionHeadingStyle}>회의 메모</span>
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
                fontSize: 16,
                color: '#364153',
                lineHeight: '1.6',
                background: 'transparent',
                fontFamily: 'inherit',
                letterSpacing: '-0.35px',
              }}
            />
          </div>

          {/* Schedules */}
          <div style={{ ...cardStyle, paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconCalendar width={20} height={20} />
                <span style={sectionHeadingStyle}>정해진 일정</span>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280', display: 'flex', padding: 0 }}
              >
                +
              </button>
            </div>
            {meeting.schedules && meeting.schedules.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>
                {meeting.schedules.map((s: Schedule) => (
                  <div
                    key={s.id}
                    style={{
                      background: '#f0fff2',
                      border: '1px solid #d7f9d0',
                      borderRadius: 8,
                      padding: '10px 17px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 16, color: '#000000', letterSpacing: '-0.35px' }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: 12, color: '#909090', letterSpacing: '-0.26px' }}>
                      {s.startTime.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#9E9E9E', fontSize: 14, paddingBottom: 24 }}>추출된 일정이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
