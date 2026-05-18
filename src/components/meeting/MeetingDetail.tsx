'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { IconEdit, IconCheck, IconChat, IconPlay, IconMemo, IconCalendar, IconTrash } from '@/components/icons'
import type { Meeting, Schedule, MeetingSummary } from '@/types'
import { useUpdateMeeting } from '@/hooks/useMeetings'
import { useUpdateMemo } from '@/hooks/useMemos'
import { useCreateSchedule, useDeleteSchedule } from '@/hooks/useSchedules'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { SchedulePopup } from '@/components/project/SchedulePopup'

interface MeetingDetailProps {
  meeting: Meeting
  projectId: string
  meetings: MeetingSummary[]
  liveScripts?: { startTime: number; contents: string }[]
  liveSummary?: string
}

function formatScheduleDate(s: Schedule): string {
  const startDate = s.startTime.slice(0, 10)
  const endDate = s.endTime.slice(0, 10)
  const sameDay = startDate === endDate

  if (s.allDay) {
    return sameDay ? startDate : `${startDate}\n~ ${endDate}`
  }

  const startDateTime = s.startTime.slice(0, 16).replace('T', ' ')
  const endTime = s.endTime.slice(11, 16)
  const endDateTime = s.endTime.slice(0, 16).replace('T', ' ')

  return sameDay
    ? `${startDateTime}\n~ ${endTime}`
    : `${startDateTime}\n~ ${endDateTime}`
}

function formatSeconds(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export function MeetingDetail({ meeting, projectId, meetings, liveScripts, liveSummary }: MeetingDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(meeting.title)
  const [dateDraft, setDateDraft] = useState(
    (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
  )
  const [memoDraft, setMemoDraft] = useState(meeting.memo ?? '')
  const [memoSaveTimeout, setMemoSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const updateMeeting = useUpdateMeeting(meeting.id)
  const updateMemo = useUpdateMemo(meeting.id)
  const createSchedule = useCreateSchedule(projectId)
  const deleteSchedule = useDeleteSchedule()
  const qc = useQueryClient()
  const [hoveredScheduleId, setHoveredScheduleId] = useState<string | null>(null)
  const [editSchedule, setEditSchedule] = useState<{ schedule: Schedule; x: number; y: number } | null>(null)

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

  const handleAddSchedule = async (e: React.MouseEvent) => {
    const date = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
    const created = await createSchedule.mutateAsync({
      title: '새 일정',
      startTime: `${date}T09:00:00`,
      endTime: `${date}T10:00:00`,
      allDay: false,
      meetingId: meeting.id,
    })
    const newSchedule: Schedule = {
      ...created,
      allDay: false,
      meetingId: meeting.id,
      createdAt: created.createdAt ?? new Date().toISOString(),
    }
    setEditSchedule({ schedule: newSchedule, x: e.clientX, y: e.clientY })
  }

  const displayDate = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)

  const card = 'bg-card border border-card-border rounded-[10px] p-[25px]'
  const sectionHeading = 'text-xl font-semibold text-title'

  return (
    <>
    <div className="flex flex-col gap-6">

      {/* ── Header card ── */}
      {isEditing ? (
        <div className={`${card} border-2 border-primary flex items-center justify-between gap-4`}>
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEditSave() }}
            className="flex-1 text-[26px] font-bold text-title border-none outline-none bg-transparent font-[inherit]"
          />
          <input
            type="date"
            value={dateDraft}
            onChange={e => setDateDraft(e.target.value)}
            className="text-lg text-subtitle border-none outline-none bg-transparent cursor-pointer font-[inherit] shrink-0"
          />
          <button
            onClick={handleEditSave}
            disabled={updateMeeting.isPending}
            className="bg-transparent border-none cursor-pointer p-0 shrink-0"
          >
            <IconCheck width={20} height={20} className="text-primary" />
          </button>
        </div>
      ) : (
        <div className={`${card} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold text-title m-0 tracking-[0.4px]">
              {meeting.title}
            </h1>
            <button
              onClick={handleEditStart}
              className="bg-transparent border-none cursor-pointer p-0 flex"
            >
              <IconEdit width={20} height={20} className="text-text-tertiary" />
            </button>
          </div>
          <span className="text-[16px] text-subtitle tracking-[-0.31px] shrink-0">
            {displayDate}
          </span>
        </div>
      )}

      {/* ── Summary ── */}
      {(liveSummary !== undefined || meeting.summary) && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-4">
            <IconChat width={20} height={20} className="text-primary" />
            <span className={sectionHeading}>회의 요약</span>
          </div>
          <p className="text-[16px] text-body leading-[26px] m-0 tracking-[-0.31px] min-h-[26px]">
            {liveSummary ?? meeting.summary}
          </p>
        </div>
      )}

      {/* ── Script + Right column ── */}
      <div className="flex gap-7 items-start">

        {/* Script */}
        <div className={`${card} flex-1 min-w-0 pt-[25px] px-[25px] pb-px`}>
          <div className="flex items-center gap-2 mb-6">
            <IconPlay width={20} height={20} />
            <span className="text-[20px] font-semibold text-title tracking-[-0.45px]">
              회의 스크립트
            </span>
          </div>
          {((liveScripts ?? meeting.scripts)?.length ?? 0) > 0 ? (
            <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pb-6">
              {(liveScripts ?? meeting.scripts).map((seg, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="text-md text-[#e5e5e8] min-w-[48px] shrink-0 tracking-[-0.15px]">
                    {formatSeconds(seg.startTime)}
                  </span>
                  <p className="text-[16px] text-body leading-6 m-0 tracking-[-0.31px]">
                    {seg.contents}
                  </p>
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
          <div className={card}>
            <div className="flex items-center gap-2 mb-4">
              <IconMemo width={20} height={20} />
              <span className={sectionHeading}>회의 메모</span>
            </div>
            <textarea
              value={memoDraft}
              onChange={e => handleMemoChange(e.target.value)}
              onBlur={handleMemoBlur}
              placeholder="회의 메모를 입력하세요..."
              className="w-full min-h-[100px] border-none outline-none resize-y text-[16px] text-body leading-relaxed bg-transparent font-[inherit] tracking-[-0.35px]"
            />
          </div>

          {/* Schedules */}
          <div className={`${card} pb-px`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IconCalendar width={20} height={20} />
                <span className={sectionHeading}>정해진 일정</span>
              </div>
              <button
                onClick={handleAddSchedule}
                disabled={createSchedule.isPending}
                className="bg-transparent border-none cursor-pointer text-[20px] text-[#6b7280] flex p-0 disabled:opacity-40"
              >
                +
              </button>
            </div>
            {meeting.schedules && meeting.schedules.length > 0 ? (
              <div className="flex flex-col gap-2 pb-6">
                {meeting.schedules.map((s: Schedule) => (
                  <div
                    key={s.id}
                    onMouseEnter={() => setHoveredScheduleId(s.id)}
                    onMouseLeave={() => setHoveredScheduleId(null)}
                    className="bg-schedule-item border border-schedule-item-border rounded-md px-[17px] py-2.5 flex items-center justify-between"
                  >
                    <span className="text-[16px] text-title tracking-[-0.35px]">{s.title}</span>
                    <div className="relative flex items-center justify-end shrink-0">
                      <span className={`text-sm text-[#909090] tracking-[-0.26px] text-right whitespace-pre-line leading-[18px] ${hoveredScheduleId === s.id ? 'invisible' : ''}`}>
                        {formatScheduleDate(s)}
                      </span>
                      {hoveredScheduleId === s.id && (
                        <div className="absolute right-0 flex items-center gap-2">
                          <button
                            onClick={e => setEditSchedule({ schedule: s, x: e.clientX, y: e.clientY })}
                            className="bg-transparent border-none cursor-pointer p-0 flex"
                          >
                            <IconEdit width={15} height={15} className="text-text-tertiary" />
                          </button>
                          <button
                            onClick={() => deleteSchedule.mutate(s.id, {
                              onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meeting.id) }),
                            })}
                            className="bg-transparent border-none cursor-pointer p-0 flex"
                          >
                            <IconTrash width={15} height={15} className="text-danger" />
                          </button>
                        </div>
                      )}
                    </div>
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

    {editSchedule && (
      <SchedulePopup
        schedule={editSchedule.schedule}
        projectId={projectId}
        meetings={meetings}
        position={{ x: editSchedule.x, y: editSchedule.y }}
        initialMode="edit"
        onClose={() => {
          setEditSchedule(null)
          qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meeting.id) })
        }}
      />
    )}
    </>
  )
}
