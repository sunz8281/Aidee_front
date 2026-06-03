'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { IconMemo } from '@/components/icons'
import { Header } from '@/components/ui/Header'
import { MeetingList } from '@/components/project/MeetingList'
import { ProjectCalendar } from '@/components/project/ProjectCalendar'
import { MemoSection } from '@/components/project/MemoSection'
import { useSharedProject } from '@/hooks/useProjects'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function SharedProjectPage() {
  const { shareToken } = useParams() as { shareToken: string }
  const { data: project, isLoading, isError } = useSharedProject(shareToken)

  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-md text-text-tertiary">불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-[64px] font-bold text-text-primary leading-none">404</p>
          <p className="text-lg font-semibold text-text-primary">프로젝트를 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const meetings = project.meetings ?? []
  const memos = project.memos ?? []

  const calFrom = (() => {
    const firstDayOfMonth = new Date(calYear, calMonth - 1, 1)
    const startOffset = firstDayOfMonth.getDay()
    const from = new Date(calYear, calMonth - 1, 1 - startOffset)
    return `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`
  })()
  const calTo = (() => {
    const firstDayOfMonth = new Date(calYear, calMonth - 1, 1)
    const startOffset = firstDayOfMonth.getDay()
    const to = new Date(calYear, calMonth - 1, 1 - startOffset + 41)
    return `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`
  })()

  // 공유 API에서 받은 전체 일정 중 현재 달력 범위에 해당하는 것만 필터링
  const visibleSchedules = (project.schedules ?? []).filter(s => {
    const start = s.startTime.slice(0, 10)
    const end = s.endTime.slice(0, 10)
    return start <= calTo && end >= calFrom
  })

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="max-w-[1280px] mx-auto w-full px-8 pt-8 pb-20">
        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-text-primary m-0">{project.name}</h1>
            <span className="text-sm text-text-tertiary ml-1">· 읽기 전용</span>
          </div>
        </div>

        {/* Meeting list + Calendar */}
        <div className="flex gap-4 items-stretch">
          <div className="w-[300px] shrink-0 flex">
            <MeetingList
              projectId={project.id}
              meetings={meetings}
              getMeetingHref={id => `/share/${shareToken}/meetings/${id}`}
            />
          </div>
          <ProjectCalendar
            projectId={project.id}
            schedules={visibleSchedules}
            meetings={meetings}
            year={calYear}
            month={calMonth}
            onMonthChange={(y, m) => {
              setCalYear(y)
              setCalMonth(m)
            }}
            readOnly
          />
        </div>

        {/* Memo section */}
        <div className="bg-card border border-border rounded-lg px-5 py-4 mt-6">
          <div className={['flex items-center gap-2', memos.length ? 'mb-4' : ''].join(' ')}>
            <IconMemo width={16} height={16} />
            <span className="text-md font-semibold text-text-primary">메모</span>
          </div>
          {memos.length > 0 ? (
            <MemoSection memos={memos} meetings={meetings} readOnly />
          ) : (
            <div className="text-base text-text-tertiary py-2">회의 메모가 없습니다.</div>
          )}
        </div>
      </main>
    </div>
  )
}
