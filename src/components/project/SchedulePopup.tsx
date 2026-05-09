'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useUpdateSchedule, useDeleteSchedule } from '@/hooks/useSchedules'
import { IconEdit, IconCheck, IconTrash } from '@/components/icons'
import type { Schedule, MeetingSummary } from '@/types'

interface SchedulePopupProps {
  schedule: Schedule
  projectId: string
  meetings: MeetingSummary[]
  position: { x: number; y: number }
  onClose: () => void
  initialMode?: 'view' | 'edit'
}

const POPUP_W = 210

function formatDateTime(iso: string, allDay: boolean) {
  if (!iso) return ''
  if (allDay) return iso.slice(0, 10)
  return iso.slice(0, 16).replace('T', ' ')
}

function toInputValue(iso: string, allDay: boolean) {
  return allDay ? iso.slice(0, 10) : iso.slice(0, 16)
}

function toIso(value: string, allDay: boolean, isEnd: boolean) {
  if (allDay) return isEnd ? `${value}T23:59:59` : `${value}T00:00:00`
  return value.length === 16 ? `${value}:00` : value
}

export function SchedulePopup({
  schedule,
  projectId,
  meetings,
  position,
  onClose,
  initialMode = 'view',
}: SchedulePopupProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [title, setTitle] = useState(schedule.title)
  const [allDay, setAllDay] = useState(schedule.allDay)
  const [startVal, setStartVal] = useState(toInputValue(schedule.startTime, schedule.allDay))
  const [endVal, setEndVal] = useState(toInputValue(schedule.endTime, schedule.allDay))
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(schedule.meetingId ?? null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const update = useUpdateSchedule(projectId)
  const del = useDeleteSchedule()
  const popupRef = useRef<HTMLDivElement>(null)

  const x = Math.min(position.x + 8, window.innerWidth - POPUP_W - 8)
  const y = Math.min(position.y, window.innerHeight - 320)

  const sourceMeeting = meetings.find(m => m.id === schedule.meetingId)
  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId)

  const handleSave = async () => {
    await update.mutateAsync({
      id: schedule.id,
      title,
      allDay,
      startTime: toIso(startVal, allDay, false),
      endTime: toIso(endVal, allDay, true),
      meetingId: selectedMeetingId,
    })
    onClose()
  }

  const handleDelete = async () => {
    await del.mutateAsync(schedule.id)
    onClose()
  }

  const handleAllDayChange = (checked: boolean) => {
    setAllDay(checked)
    setStartVal(startVal.slice(0, 10))
    setEndVal(endVal.slice(0, 10))
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  /* ── VIEW MODE ── */
  if (mode === 'view') {
    return (
      <div
        ref={popupRef}
        className="fixed z-[1000] flex flex-col gap-2.5 rounded-sm shadow-[0px_4px_12px_rgba(0,0,0,0.12)] px-[14px] py-2.5 bg-schedule-chip"
        style={{ left: x, top: y, width: POPUP_W }}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5 min-w-0 flex-1 mr-2">
            <span className="text-sm font-bold text-schedule-chip-text">
              {schedule.title}
            </span>
            {schedule.meetingId && sourceMeeting && (
              <Link
                href={`/projects/${projectId}/meetings/${schedule.meetingId}`}
                onClick={onClose}
                className="flex items-center gap-1 text-sm text-schedule-chip-text no-underline"
              >
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {sourceMeeting.title}
                </span>
                <span className="text-xs shrink-0">↗</span>
              </Link>
            )}
          </div>
          <button
            onClick={() => setMode('edit')}
            className="bg-transparent border-none cursor-pointer p-0 shrink-0"
          >
            <IconEdit width={16} height={16} className="text-schedule-chip-text" />
          </button>
        </div>

        <div className="text-sm text-[#808080] leading-[18px]">
          <div>{formatDateTime(schedule.startTime, schedule.allDay)}</div>
          <div>~ {formatDateTime(schedule.endTime, schedule.allDay)}</div>
        </div>
      </div>
    )
  }

  /* ── EDIT MODE ── */
  return (
    <div
      ref={popupRef}
      className="fixed z-[1000] flex flex-col gap-2.5 rounded-sm shadow-[0px_4px_12px_rgba(0,0,0,0.12)] px-[14px] py-2.5 bg-card border border-primary overflow-visible"
      style={{ left: x, top: y, width: POPUP_W }}
    >
      {/* Title + save */}
      <div className="flex items-center justify-between gap-2">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          className="flex-1 text-sm font-bold text-title border-none outline-none bg-transparent p-0"
        />
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="bg-transparent border-none cursor-pointer p-0 shrink-0"
        >
          <IconCheck width={16} height={16} className="text-primary" />
        </button>
      </div>

      {/* Meeting selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="w-full flex items-center justify-between gap-1 bg-transparent border-none cursor-pointer p-0"
        >
          <span className={['text-sm overflow-hidden text-ellipsis whitespace-nowrap', selectedMeeting ? 'text-title' : 'text-[#b0b0b0]'].join(' ')}>
            {selectedMeeting?.title ?? '연결된 회의 없음'}
          </span>
          <span className="text-[10px] text-[#808080] shrink-0">▾</span>
        </button>

        {dropdownOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-card border border-[#dedede] rounded-md z-[1002] overflow-hidden max-h-[160px] overflow-y-auto">
            <div
              onMouseDown={e => e.stopPropagation()}
              onClick={() => { setSelectedMeetingId(null); setDropdownOpen(false) }}
              className={['px-2 py-1.5 text-sm text-[#808080] cursor-pointer', selectedMeetingId === null ? 'bg-dropdown-selected' : 'bg-card'].join(' ')}
            >
              없음
            </div>
            {meetings.map(m => (
              <div
                key={m.id}
                onMouseDown={e => e.stopPropagation()}
                onClick={() => { setSelectedMeetingId(m.id); setDropdownOpen(false) }}
                className={['px-2 py-1.5 text-sm text-title cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap', m.id === selectedMeetingId ? 'bg-dropdown-selected' : 'bg-card'].join(' ')}
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
          checked={allDay}
          onChange={e => handleAllDayChange(e.target.checked)}
          className="w-3 h-3 cursor-pointer accent-primary"
        />
        <span className={['text-sm', allDay ? 'text-title' : 'text-[#808080]'].join(' ')}>
          하루 종일
        </span>
      </label>

      {/* Date/time */}
      <div className="flex flex-col gap-1">
        <input
          type={allDay ? 'date' : 'datetime-local'}
          value={startVal}
          onChange={e => setStartVal(e.target.value)}
          className="text-xs text-[#808080] border-none outline-none bg-transparent p-0 w-full"
        />
        <span className="text-xs text-[#c0c0c0]">~</span>
        <input
          type={allDay ? 'date' : 'datetime-local'}
          value={endVal}
          onChange={e => setEndVal(e.target.value)}
          className="text-xs text-[#808080] border-none outline-none bg-transparent p-0 w-full"
        />
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={del.isPending}
        className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 self-start"
      >
        <IconTrash width={11} height={11} className="text-danger" />
        <span className="text-xs text-danger">삭제</span>
      </button>
    </div>
  )
}
