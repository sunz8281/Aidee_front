'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { IconLogo } from '@/components/icons'
import { useSharedProject } from '@/hooks/useProjects'

export default function SharedProjectPage() {
  const { shareToken } = useParams() as { shareToken: string }
  const { data: project, isLoading, isError } = useSharedProject(shareToken)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="text-md text-text-tertiary">불러오는 중...</span>
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-text-primary">공유가 해제된 프로젝트입니다.</p>
        <p className="text-base text-text-tertiary">링크가 만료되었거나 공유가 중단되었습니다.</p>
      </div>
    )
  }

  const meetings = project.meetings ?? []

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-8 h-[68px] bg-card border-b border-border">
        <IconLogo width={120} height={37} />
        <Link
          href="/login"
          className="text-base text-primary font-medium no-underline hover:opacity-80"
        >
          Aidee 시작하기 →
        </Link>
      </header>

      <main className="max-w-[800px] mx-auto px-8 pt-10 pb-20">
        {/* Project name */}
        <h1 className="text-[26px] font-bold text-text-primary mb-1">{project.name}</h1>
        <p className="text-base text-text-tertiary mb-8">공유된 프로젝트 · 읽기 전용</p>

        {/* Meeting list */}
        <div className="flex flex-col gap-3">
          {meetings.length === 0 ? (
            <div className="text-base text-text-tertiary py-4">회의가 없습니다.</div>
          ) : (
            meetings.map(meeting => {
              const dateStr = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
              return (
                <div
                  key={meeting.id}
                  className="bg-card border border-border rounded-[10px] px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[16px] font-semibold text-text-primary">{meeting.title}</span>
                    <span className="text-sm text-text-tertiary shrink-0 ml-4">{dateStr}</span>
                  </div>
                  {meeting.summary && (
                    <p className="text-base text-text-secondary line-clamp-2 m-0">{meeting.summary}</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
