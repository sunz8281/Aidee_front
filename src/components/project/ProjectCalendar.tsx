'use client'

import { useState } from 'react'
import type { Schedule, MeetingSummary } from '@/types'
import { useCreateSchedule } from '@/hooks/useSchedules'
import { SchedulePopup } from './SchedulePopup'

interface ProjectCalendarProps {
  projectId: string
  schedules: Schedule[]
  meetings: MeetingSummary[]
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function ProjectCalendar({
  projectId,
  schedules,
  meetings,
  year,
  month,
  onMonthChange,
}: ProjectCalendarProps) {
  const [popup, setPopup] = useState<{ schedule: Schedule; position: { x: number; y: number }; initialMode: 'view' | 'edit' } | null>(null)

  const createSchedule = useCreateSchedule(projectId)

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

  const cells: Array<{ day: number; currentMonth: boolean }> = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: daysInPrevMonth - firstDay + 1 + i, currentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false })
  }

  const getSchedulesForDay = (day: number) => {
    if (!schedules) return []
    return schedules.filter(s => {
      const d = new Date(s.startTime)
      return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day
    })
  }

  const today = new Date()

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12)
    else onMonthChange(year, month - 1)
  }
  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1)
    else onMonthChange(year, month + 1)
  }

  const handleDayClick = async (day: number, e: React.MouseEvent) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${year}-${pad(month)}-${pad(day)}`
    const created = await createSchedule.mutateAsync({
      title: '새 일정',
      startTime: `${dateStr}T09:00:00`,
      endTime: `${dateStr}T10:00:00`,
      allDay: false,
    })
    const newSchedule: Schedule = {
      ...created,
      allDay: false,
      createdAt: created.createdAt ?? new Date().toISOString(),
    }
    setPopup({ schedule: newSchedule, position: { x: e.clientX, y: e.clientY }, initialMode: 'edit' })
  }

  const handleScheduleClick = (s: Schedule, e: React.MouseEvent) => {
    e.stopPropagation()
    setPopup({ schedule: s, position: { x: e.clientX, y: e.clientY }, initialMode: 'view' })
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-5 flex-1">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="bg-transparent border-none cursor-pointer text-text-secondary text-xl px-1"
          >
            ‹
          </button>
          <span className="text-lg font-semibold text-text-primary">
            {year}년 {month}월
          </span>
          <button
            onClick={nextMonth}
            className="bg-transparent border-none cursor-pointer text-text-secondary text-xl px-1"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={[
                'text-center text-sm font-medium pb-2',
                i === 0 ? 'text-danger' : i === 6 ? 'text-primary' : 'text-text-secondary',
              ].join(' ')}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell, idx) => {
            const colIdx = idx % 7
            const isToday =
              cell.currentMonth &&
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === cell.day

            const daySchedules = cell.currentMonth ? getSchedulesForDay(cell.day) : []

            return (
              <div
                key={idx}
                onClick={cell.currentMonth ? (e) => handleDayClick(cell.day, e) : undefined}
                className={[
                  'min-h-16 p-[4px_3px] rounded-sm relative',
                  cell.currentMonth ? 'cursor-pointer' : 'cursor-default bg-surface',
                ].join(' ')}
              >
                <div
                  className={[
                    'text-sm text-center w-5 h-5 leading-5 rounded-full mx-auto mb-0.5',
                    isToday
                      ? 'text-white font-bold bg-primary'
                      : !cell.currentMonth
                      ? 'text-[#D0D0D0]'
                      : colIdx === 0
                      ? 'text-danger'
                      : colIdx === 6
                      ? 'text-primary'
                      : 'text-text-primary',
                  ].join(' ')}
                >
                  {cell.day}
                </div>
                {daySchedules.slice(0, 2).map(s => (
                  <div
                    key={s.id}
                    onClick={e => handleScheduleClick(s, e)}
                    className="text-[10px] bg-schedule-chip text-schedule-chip-text rounded-[3px] px-1 py-px mb-px overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                    title={s.title}
                  >
                    {s.title}
                  </div>
                ))}
                {daySchedules.length > 2 && (
                  <div className="text-[10px] text-text-tertiary">
                    +{daySchedules.length - 2}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {popup && (
        <SchedulePopup
          schedule={popup.schedule}
          projectId={projectId}
          meetings={meetings}
          position={popup.position}
          onClose={() => setPopup(null)}
          initialMode={popup.initialMode}
        />
      )}
    </>
  )
}
