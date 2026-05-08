'use client'

import Link from 'next/link'
import type { MeetingSummary } from '@/types'

interface MeetingListProps {
  projectId: string
  meetings: MeetingSummary[]
  onAdd: () => void
  isCreating?: boolean
}

export function MeetingList({ projectId, meetings, onAdd, isCreating }: MeetingListProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E5E5E5',
        borderRadius: 12,
        padding: '16px 0',
        minHeight: 200,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '0 20px 12px', borderBottom: '1px solid #F0F0F0' }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="#3B5BDB"
            />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
            최근 회의
          </span>
        </div>
        <button
          onClick={onAdd}
          disabled={isCreating}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B5BDB',
            fontSize: 18,
            fontWeight: 500,
          }}
          title="새 회의 추가"
        >
          +
        </button>
      </div>

      {/* List */}
      <div>
        {meetings.length === 0 && (
          <div
            style={{ padding: '24px 20px', color: '#9E9E9E', fontSize: 13, textAlign: 'center' }}
          >
            회의가 없습니다
          </div>
        )}
        {meetings.map(meeting => (
          <Link key={meeting.id} href={`/projects/${projectId}/meetings/${meeting.id}`}>
            <div
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid #F8F8F8',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = '#F8F9FF'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', marginBottom: 2 }}>
                {meeting.title}
              </div>
              <div style={{ fontSize: 12, color: '#9E9E9E' }}>
                {meeting.meetingAt
                  ? new Date(meeting.meetingAt).toLocaleDateString('ko-KR')
                  : new Date(meeting.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
