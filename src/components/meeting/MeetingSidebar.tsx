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
        width: 240,
        flexShrink: 0,
        background: '#F8F8F8',
        borderLeft: '1px solid #E5E5E5',
        overflowY: 'auto',
      }}
    >
      {/* Add button */}
      <div
        className="flex items-center justify-end"
        style={{ padding: '12px 16px', borderBottom: '1px solid #E5E5E5' }}
      >
        <button
          onClick={handleAdd}
          disabled={createMeeting.isPending}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3B5BDB',
            fontSize: 20,
            fontWeight: 500,
            width: 28,
            height: 28,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="새 회의 추가"
        >
          +
        </button>
      </div>

      {/* Meeting list */}
      <div>
        {meetings.map(meeting => {
          const isActive = meeting.id === activeMeetingId
          const dateStr = meeting.meetingAt
            ? new Date(meeting.meetingAt).toLocaleDateString('ko-KR')
            : new Date(meeting.createdAt).toLocaleDateString('ko-KR')

          return (
            <Link key={meeting.id} href={`/projects/${projectId}/meetings/${meeting.id}`}>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F0F0F0',
                  background: isActive ? '#3B5BDB' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background = '#EEF2FF'
                }}
                onMouseLeave={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isActive ? '#ffffff' : '#1A1A1A',
                    marginBottom: 2,
                  }}
                >
                  {meeting.title}
                </div>
                <div style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.7)' : '#9E9E9E' }}>
                  {dateStr}
                </div>
                {!isActive && meeting.status === 'done' && (
                  <p
                    style={{
                      fontSize: 11,
                      color: '#9E9E9E',
                      marginTop: 4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    } as React.CSSProperties}
                  >
                    {/* summary preview — shown when available */}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
