'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MeetingSummary } from '@/types'
import { useCreateMeeting } from '@/hooks/useMeetings'

interface MeetingSidebarProps {
  projectId: string
  meetings: MeetingSummary[]
  activeMeetingId: string
}

export function MeetingSidebar({ projectId, meetings, activeMeetingId }: MeetingSidebarProps) {
  const router = useRouter()
  const createMeeting = useCreateMeeting(projectId)

  const handleAdd = async () => {
    const res = await createMeeting.mutateAsync({})
    router.push(`/projects/${projectId}/meetings/${res.id}`)
  }

  return (
    <aside
      style={{
        width: 349,
        flexShrink: 0,
        background: '#e5e5e8',
        overflowY: 'auto',
        padding: '20px 27px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button
          onClick={handleAdd}
          disabled={createMeeting.isPending}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 22,
            color: '#4a5565',
            lineHeight: 1,
            padding: 0,
          }}
          title="새 회의 추가"
        >
          +
        </button>
      </div>

      {/* Meeting cards */}
      {meetings.map(meeting => {
        const isActive = meeting.id === activeMeetingId
        const dateStr = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)

        return (
          <Link key={meeting.id} href={`/projects/${projectId}/meetings/${meeting.id}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: isActive ? '#004fff' : '#ffffff',
                borderRadius: 16,
                padding: '20px 24px',
                minHeight: 113,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Top row: title + date */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: isActive ? '#ffffff' : '#0a0a0a',
                    letterSpacing: '-0.44px',
                    lineHeight: '1.4',
                  }}
                >
                  {meeting.title}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    color: isActive ? '#97beff' : '#a3a3a3',
                    letterSpacing: '-0.35px',
                    flexShrink: 0,
                    paddingTop: 2,
                  }}
                >
                  {dateStr}
                </span>
              </div>

            </div>
          </Link>
        )
      })}
    </aside>
  )
}
