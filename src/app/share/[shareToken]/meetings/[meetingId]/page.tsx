'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { IconLogo, IconChat, IconPlay, IconMemo, IconCalendar } from '@/components/icons'
import { useSharedMeeting } from '@/hooks/useMeetings'
import type { Schedule } from '@/types'

function formatSeconds(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function formatScheduleDate(s: Schedule): string {
  const startDate = s.startTime.slice(0, 10)
  const endDate = s.endTime.slice(0, 10)
  const sameDay = startDate === endDate
  if (s.allDay) return sameDay ? startDate : `${startDate} ~ ${endDate}`
  const startDateTime = s.startTime.slice(0, 16).replace('T', ' ')
  const endTime = s.endTime.slice(11, 16)
  const endDateTime = s.endTime.slice(0, 16).replace('T', ' ')
  return sameDay ? `${startDateTime} ~ ${endTime}` : `${startDateTime} ~ ${endDateTime}`
}

export default function SharedMeetingPage() {
  const { shareToken, meetingId } = useParams() as { shareToken: string; meetingId: string }
  const { data: meeting, isLoading, isError } = useSharedMeeting(shareToken, meetingId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="text-md text-text-tertiary">불러오는 중...</span>
      </div>
    )
  }

  if (isError || !meeting) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-text-primary">회의를 찾을 수 없습니다.</p>
        <p className="text-base text-text-tertiary">공유가 해제되었거나 잘못된 링크입니다.</p>
      </div>
    )
  }

  const card = 'bg-card border border-card-border rounded-[10px] p-[25px]'
  const sectionHeading = 'text-xl font-semibold text-title'
  const displayDate = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
  const speakerMap = meeting.speakerNames ?? {}
  const schedules = meeting.schedules ?? []

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-8 h-[68px] bg-card border-b border-border shrink-0">
        <IconLogo width={120} height={37} />
        <Link
          href="/login"
          className="text-base text-primary font-medium no-underline hover:opacity-80"
        >
          Aidee 시작하기 →
        </Link>
      </header>

      <main className="flex-1 px-8 pt-6 pb-20 max-w-[1280px] mx-auto w-full">
        {/* Back link */}
        <div className="mb-4">
          <Link href={`/share/${shareToken}`}>
            <span className="text-base text-text-secondary cursor-pointer inline-flex items-center gap-1">
              ‹ 프로젝트로 돌아가기
            </span>
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          {/* Header card */}
          <div className={`${card} flex items-center justify-between`}>
            <h1 className="text-[30px] font-bold text-title m-0 tracking-[0.4px]">
              {meeting.title}
            </h1>
            <span className="text-[16px] text-subtitle tracking-[-0.31px] shrink-0">
              {displayDate}
            </span>
          </div>

          {/* Summary */}
          {meeting.summary && (
            <div className={card}>
              <div className="flex items-center gap-2 mb-4">
                <IconChat width={20} height={20} className="text-primary" />
                <span className={sectionHeading}>회의 요약</span>
              </div>
              <p className="text-[16px] text-body leading-[26px] m-0 tracking-[-0.31px]">
                {meeting.summary}
              </p>
            </div>
          )}

          {/* Script + Right column */}
          <div className="flex gap-7 items-start">
            {/* Script */}
            <div className={`${card} flex-1 min-w-0 pt-[25px] px-[25px] pb-px`}>
              <div className="flex items-center gap-2 mb-6">
                <IconPlay width={20} height={20} />
                <span className="text-[20px] font-semibold text-title tracking-[-0.45px]">
                  회의 스크립트
                </span>
              </div>
              {(meeting.scripts?.length ?? 0) > 0 ? (
                <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pb-6">
                  {meeting.scripts.map((seg, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="text-md text-[#e5e5e8] min-w-[48px] shrink-0 tracking-[-0.15px]">
                        {formatSeconds(seg.startTime)}
                      </span>
                      <div className="flex-1 min-w-0">
                        {seg.speaker && (
                          <span className="text-sm font-medium text-primary block mb-0.5">
                            {speakerMap[seg.speaker] ?? seg.speaker}
                          </span>
                        )}
                        <p className="text-[16px] text-body leading-6 m-0 tracking-[-0.31px]">
                          {seg.contents}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-md text-text-tertiary pb-6">스크립트가 없습니다.</div>
              )}
            </div>

            {/* Right column */}
            <div className="w-[319px] shrink-0 flex flex-col gap-6">
              {/* Memo */}
              {meeting.memo && (
                <div className={card}>
                  <div className="flex items-center gap-2 mb-4">
                    <IconMemo width={20} height={20} />
                    <span className={sectionHeading}>회의 메모</span>
                  </div>
                  <p className="text-[16px] text-body leading-relaxed m-0 whitespace-pre-line tracking-[-0.35px]">
                    {meeting.memo}
                  </p>
                </div>
              )}

              {/* Schedules */}
              <div className={`${card} pb-px`}>
                <div className="flex items-center gap-2 mb-4">
                  <IconCalendar width={20} height={20} />
                  <span className={sectionHeading}>정해진 일정</span>
                </div>
                {schedules.length > 0 ? (
                  <div className="flex flex-col gap-2 pb-6">
                    {schedules.map(s => (
                      <div
                        key={s.id}
                        className="bg-schedule-item border border-schedule-item-border rounded-md px-[17px] py-2.5 flex items-center justify-between"
                      >
                        <span className="text-[16px] text-title tracking-[-0.35px]">{s.title}</span>
                        <span className="text-sm text-[#909090] tracking-[-0.26px] shrink-0 ml-2">
                          {formatScheduleDate(s)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-md text-text-tertiary pb-6">추출된 일정이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
