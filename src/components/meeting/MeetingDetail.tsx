'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { IconEdit, IconCheck, IconChat, IconPlay, IconMemo, IconCalendar, IconTrash } from '@/components/icons'
import type { Meeting, Schedule, MeetingSummary } from '@/types'
import { useUpdateMeeting, useUpdateSpeaker } from '@/hooks/useMeetings'
import { useUpdateMemo } from '@/hooks/useMemos'
import { useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from '@/hooks/useSchedules'
import { QUERY_KEYS } from '@/constants/queryKeys'

interface MeetingDetailProps {
  meeting: Meeting
  projectId: string
  meetings: MeetingSummary[]
  liveScripts?: { startTime: number; speaker?: string; contents: string }[]
  liveSummary?: string
}

interface InlineEdit {
  schedule: Schedule
  title: string
  allDay: boolean
  startVal: string
  endVal: string
  selectedMeetingId: string | null
  dropdownOpen: boolean
  prevStart: string
  prevEnd: string
}

function toInputValue(iso: string, allDay: boolean) {
  return allDay ? iso.slice(0, 10) : iso.slice(0, 16)
}

function toIso(value: string, allDay: boolean, isEnd: boolean) {
  if (allDay) return isEnd ? `${value}T23:59:59` : `${value}T00:00:00`
  return value.length === 16 ? `${value}:00` : value
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

interface InlineEditFormProps {
  inlineEdit: InlineEdit
  meetings: MeetingSummary[]
  savePending: boolean
  deletePending: boolean
  onChange: (patch: Partial<InlineEdit>) => void
  onSave: () => void
  onDelete: () => void
}

function InlineEditForm({ inlineEdit, meetings, savePending, deletePending, onChange, onSave, onDelete }: InlineEditFormProps) {
  const selectedMeeting = meetings.find(m => m.id === inlineEdit.selectedMeetingId)

  const handleAllDayChange = (checked: boolean) => {
    if (checked) {
      onChange({
        allDay: true,
        prevStart: inlineEdit.startVal,
        prevEnd: inlineEdit.endVal,
        startVal: inlineEdit.startVal.slice(0, 10),
        endVal: inlineEdit.endVal.slice(0, 10),
      })
    } else {
      const startTime = inlineEdit.prevStart.length > 10 ? inlineEdit.prevStart.slice(11, 16) : '00:00'
      const endTime = inlineEdit.prevEnd.length > 10 ? inlineEdit.prevEnd.slice(11, 16) : '23:59'
      onChange({
        allDay: false,
        startVal: `${inlineEdit.startVal}T${startTime}`,
        endVal: `${inlineEdit.endVal}T${endTime}`,
      })
    }
  }

  return (
    <div className="bg-card border-2 border-primary rounded-md px-[17px] py-3 flex flex-col gap-2.5">
      {/* Title + save */}
      <div className="flex items-center justify-between gap-2">
        <input
          autoFocus
          value={inlineEdit.title}
          onChange={e => onChange({ title: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter') onSave() }}
          className="flex-1 text-[15px] font-bold text-title border-none outline-none bg-transparent p-0"
        />
        <button
          onClick={onSave}
          disabled={savePending}
          className="bg-transparent border-none cursor-pointer p-0 shrink-0"
        >
          <IconCheck width={15} height={15} className="text-primary" />
        </button>
      </div>

      {/* Meeting selector */}
      <div className="relative">
        <button
          onClick={() => onChange({ dropdownOpen: !inlineEdit.dropdownOpen })}
          className="w-full flex items-center justify-between gap-1 bg-transparent border-none cursor-pointer p-0"
        >
          <span className={['text-sm overflow-hidden text-ellipsis whitespace-nowrap', selectedMeeting ? 'text-title' : 'text-[#b0b0b0]'].join(' ')}>
            {selectedMeeting?.title ?? '연결된 회의 없음'}
          </span>
          <span className="text-[10px] text-[#808080] shrink-0">▾</span>
        </button>
        {inlineEdit.dropdownOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-card border border-[#dedede] rounded-md z-10 overflow-hidden max-h-[160px] overflow-y-auto">
            <div
              onClick={() => onChange({ selectedMeetingId: null, dropdownOpen: false })}
              className={['px-2 py-1.5 text-sm text-[#808080] cursor-pointer', inlineEdit.selectedMeetingId === null ? 'bg-dropdown-selected' : 'bg-card'].join(' ')}
            >
              없음
            </div>
            {meetings.map(m => (
              <div
                key={m.id}
                onClick={() => onChange({ selectedMeetingId: m.id, dropdownOpen: false })}
                className={['px-2 py-1.5 text-sm text-title cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap', m.id === inlineEdit.selectedMeetingId ? 'bg-dropdown-selected' : 'bg-card'].join(' ')}
              >
                {m.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All-day */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={inlineEdit.allDay}
          onChange={e => handleAllDayChange(e.target.checked)}
          className="w-3 h-3 cursor-pointer accent-primary"
        />
        <span className={['text-sm', inlineEdit.allDay ? 'text-title' : 'text-[#808080]'].join(' ')}>
          하루 종일
        </span>
      </label>

      {/* Date/time */}
      <div className="flex flex-col gap-1">
        <input
          type={inlineEdit.allDay ? 'date' : 'datetime-local'}
          value={inlineEdit.startVal}
          onChange={e => {
            const newStart = e.target.value
            onChange({
              startVal: newStart,
              endVal: newStart && inlineEdit.endVal && newStart > inlineEdit.endVal ? newStart : inlineEdit.endVal,
            })
          }}
          className="text-xs text-[#808080] border-none outline-none bg-transparent p-0 w-full"
        />
        <span className="text-xs text-[#c0c0c0]">~</span>
        <input
          type={inlineEdit.allDay ? 'date' : 'datetime-local'}
          value={inlineEdit.endVal}
          onChange={e => onChange({ endVal: e.target.value })}
          className="text-xs text-[#808080] border-none outline-none bg-transparent p-0 w-full"
        />
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={deletePending}
        className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 self-start"
      >
        <IconTrash width={11} height={11} className="text-danger" />
        <span className="text-xs text-danger">삭제</span>
      </button>
    </div>
  )
}

export function MeetingDetail({ meeting, projectId, meetings, liveScripts, liveSummary }: MeetingDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(meeting.title)
  const [dateDraft, setDateDraft] = useState(
    (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
  )
  const [memoDraft, setMemoDraft] = useState(meeting.memo ?? '')
  const [memoSaveTimeout, setMemoSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [hoveredScheduleId, setHoveredScheduleId] = useState<string | null>(null)
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null)
  const [editingSpeakerIdx, setEditingSpeakerIdx] = useState<number | null>(null)
  const [speakerDraft, setSpeakerDraft] = useState('')

  const speakerMap = meeting.speakerNames ?? {}

  const updateMeeting = useUpdateMeeting(meeting.id)
  const updateSpeaker = useUpdateSpeaker(meeting.id)
  const updateMemo = useUpdateMemo(meeting.id)
  const createSchedule = useCreateSchedule(projectId)
  const updateSchedule = useUpdateSchedule(projectId)
  const deleteSchedule = useDeleteSchedule()
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

  const openInlineEdit = (schedule: Schedule) => {
    setInlineEdit({
      schedule,
      title: schedule.title,
      allDay: schedule.allDay,
      startVal: toInputValue(schedule.startTime, schedule.allDay),
      endVal: toInputValue(schedule.endTime, schedule.allDay),
      selectedMeetingId: schedule.meetingId ?? null,
      dropdownOpen: false,
      prevStart: toInputValue(schedule.startTime, schedule.allDay),
      prevEnd: toInputValue(schedule.endTime, schedule.allDay),
    })
  }

  const handleAddSchedule = async () => {
    const date = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
    const created = await createSchedule.mutateAsync({
      title: '새 일정',
      startTime: `${date}T09:00:00`,
      endTime: `${date}T10:00:00`,
      allDay: false,
      meetingId: meeting.id,
    })
    openInlineEdit({
      ...created,
      allDay: false,
      meetingId: meeting.id,
      createdAt: created.createdAt ?? new Date().toISOString(),
    })
  }

  const handleInlineSave = async () => {
    if (!inlineEdit) return
    await updateSchedule.mutateAsync({
      id: inlineEdit.schedule.id,
      title: inlineEdit.title,
      allDay: inlineEdit.allDay,
      startTime: toIso(inlineEdit.startVal, inlineEdit.allDay, false),
      endTime: toIso(inlineEdit.endVal, inlineEdit.allDay, true),
      meetingId: inlineEdit.selectedMeetingId,
    })
    setInlineEdit(null)
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meeting.id) })
  }

  const handleInlineDelete = async () => {
    if (!inlineEdit) return
    await deleteSchedule.mutateAsync(inlineEdit.schedule.id)
    setInlineEdit(null)
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meeting.id) })
  }

  const displayDate = (meeting.meetingAt ?? meeting.createdAt).slice(0, 10)
  const card = 'bg-card border border-card-border rounded-[10px] p-[25px]'
  const sectionHeading = 'text-xl font-semibold text-title'

  const schedulesToShow = meeting.schedules ?? []
  const showPendingAtEnd = inlineEdit && !schedulesToShow.some(s => s.id === inlineEdit.schedule.id)

  return (
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
      {(liveScripts !== undefined || liveSummary !== undefined || meeting.summary) && (
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
                  <div className="flex-1 min-w-0">
                    {seg.speaker && (
                      editingSpeakerIdx === i ? (
                        <input
                          autoFocus
                          value={speakerDraft}
                          onChange={e => setSpeakerDraft(e.target.value)}
                          onBlur={() => {
                            if (speakerDraft.trim()) {
                              updateSpeaker.mutate({ label: seg.speaker!, name: speakerDraft.trim() })
                            }
                            setEditingSpeakerIdx(null)
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setEditingSpeakerIdx(null)
                          }}
                          className="text-sm font-medium text-primary bg-transparent border-b border-primary outline-none mb-0.5 w-32"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSpeakerIdx(i)
                            setSpeakerDraft(speakerMap[seg.speaker!] ?? seg.speaker!)
                          }}
                          className="text-sm font-medium text-primary block mb-0.5 bg-transparent border-none cursor-pointer p-0 hover:underline"
                        >
                          {speakerMap[seg.speaker] ?? seg.speaker}
                        </button>
                      )
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

            {schedulesToShow.length > 0 || showPendingAtEnd ? (
              <div className="flex flex-col gap-2 pb-6">
                {schedulesToShow.map((s: Schedule) =>
                  inlineEdit?.schedule.id === s.id ? (
                    <InlineEditForm
                      key={s.id}
                      inlineEdit={inlineEdit}
                      meetings={meetings}
                      savePending={updateSchedule.isPending}
                      deletePending={deleteSchedule.isPending}
                      onChange={patch => setInlineEdit(v => v && { ...v, ...patch })}
                      onSave={handleInlineSave}
                      onDelete={handleInlineDelete}
                    />
                  ) : (
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
                              onClick={() => openInlineEdit(s)}
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
                  )
                )}

                {showPendingAtEnd && (
                  <InlineEditForm
                    inlineEdit={inlineEdit}
                    meetings={meetings}
                    savePending={updateSchedule.isPending}
                    deletePending={deleteSchedule.isPending}
                    onChange={patch => setInlineEdit(v => v && { ...v, ...patch })}
                    onSave={handleInlineSave}
                    onDelete={handleInlineDelete}
                  />
                )}
              </div>
            ) : (
              <div className="text-md text-text-tertiary pb-6">추출된 일정이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
