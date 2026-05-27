'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MeetingSummary } from '@/types'
import { useCreateMeeting } from '@/hooks/useMeetings'

interface MeetingSidebarProps {
  projectId: string
  meetings: MeetingSummary[]
  activeMeetingId: string
  getMeetingHref?: (meetingId: string) => string
}

export function MeetingSidebar({ projectId, meetings, activeMeetingId, getMeetingHref }: MeetingSidebarProps) {
  const router = useRouter()
  const createMeeting = useCreateMeeting(projectId)
  const getHref = getMeetingHref ?? ((id: string) => `/projects/${projectId}/meetings/${id}`)

  const handleAdd = async () => {
    const res = await createMeeting.mutateAsync({})
    router.push(`/projects/${projectId}/meetings/${res.id}`)
  }

  return (
    <aside className="w-[349px] shrink-0 bg-[#e5e5e8] overflow-y-auto px-[27px] py-5 flex flex-col gap-5">
      {/* Add button — 공유 페이지에서는 숨김 */}
      {!getMeetingHref && (
        <div className="flex justify-start">
          <button
            onClick={handleAdd}
            disabled={createMeeting.isPending}
            className="bg-transparent border-none cursor-pointer text-xl text-[#4a5565] leading-none p-0 disabled:opacity-50"
            title="새 회의 추가"
          >
            +
          </button>
        </div>
      )}

      {/* Meeting cards */}
      {meetings.map(meeting => {
        const isActive = meeting.id === activeMeetingId
        const dateStr = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)

        return (
          <Link
            key={meeting.id}
            href={getHref(meeting.id)}
            className="no-underline"
          >
            <div
              className={[
                'rounded-2xl px-6 py-5 h-[130px] flex flex-col justify-between',
                isActive ? 'bg-[#004fff]' : 'bg-white',
              ].join(' ')}
            >
              {/* Title + Summary group (top) */}
              <div>
                <span
                  className={[
                    'text-[17px] font-bold leading-snug tracking-[-0.38px] truncate block',
                    isActive ? 'text-white' : 'text-[#0a0a0a]',
                  ].join(' ')}
                >
                  {meeting.title}
                </span>
                <p
                  className={[
                    'text-sm mt-1 line-clamp-2 leading-[18px]',
                    meeting.summary
                      ? isActive ? 'text-[#d4e4ff]' : 'text-[#364153]'
                      : isActive ? 'text-[#97beff]' : 'text-[#a3a3a3]',
                  ].join(' ')}
                >
                  {meeting.summary ?? '빈 회의'}
                </p>
              </div>

              {/* Date — bottom right */}
              <span
                className={[
                  'text-sm tracking-[-0.25px] text-right',
                  isActive ? 'text-[#97beff]' : 'text-[#a3a3a3]',
                ].join(' ')}
              >
                {dateStr}
              </span>
            </div>
          </Link>
        )
      })}
    </aside>
  )
}
