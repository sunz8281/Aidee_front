'use client'

import Link from 'next/link'
import type { MeetingSummary } from '@/types'
import { IconChat } from '@/components/icons'

interface MeetingListProps {
  projectId: string
  meetings: MeetingSummary[]
  onAdd: () => void
  isCreating?: boolean
}

export function MeetingList({ projectId, meetings, onAdd, isCreating }: MeetingListProps) {
  const firstMeeting = meetings[0]

  return (
    <div className="bg-card border border-border rounded-lg flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <IconChat width={16} height={16} />
          <span className="text-md font-semibold text-text-primary">최근 회의</span>
        </div>
        <button
          onClick={onAdd}
          disabled={isCreating}
          className="w-6 h-6 rounded-[6px] bg-transparent border-none cursor-pointer flex items-center justify-center text-primary text-xl font-medium disabled:opacity-50"
          title="새 회의 추가"
        >
          +
        </button>
      </div>

      {/* List */}
      <div className="flex-1">
        {meetings.length === 0 && (
          <div className="px-5 py-6 text-base text-text-tertiary text-center">
            회의가 없습니다
          </div>
        )}
        {meetings.map(meeting => (
          <Link key={meeting.id} href={`/projects/${projectId}/meetings/${meeting.id}`}>
            <div className="px-5 py-2.5 cursor-pointer transition-colors hover:bg-[#F8F9FF]">
              <div className="text-md font-medium text-text-primary mb-0.5">{meeting.title}</div>
              <div className="text-sm text-text-tertiary">
                {meeting.meetingAt
                  ? new Date(meeting.meetingAt).toLocaleDateString('ko-KR')
                  : new Date(meeting.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0">
        {firstMeeting ? (
          <Link href={`/projects/${projectId}/meetings/${firstMeeting.id}`}>
            <div className="flex items-center justify-end gap-1 px-5 py-3 text-base text-text-secondary cursor-pointer transition-colors hover:text-primary">
              전체보기
              <span className="text-lg">›</span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-end gap-1 px-5 py-3 text-base text-text-placeholder">
            전체보기
            <span className="text-lg">›</span>
          </div>
        )}
      </div>
    </div>
  )
}
