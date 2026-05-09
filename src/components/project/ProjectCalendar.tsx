'use client'

import { useState } from 'react'
import type { Schedule } from '@/types'
import { useCreateSchedule } from '@/hooks/useSchedules'
import { SchedulePopup } from './SchedulePopup'

interface ProjectCalendarProps {
  projectId: string
  schedules: Schedule[]
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function ProjectCalendar({
  projectId,
  schedules,
  year,
  month,
  onMonthChange,
}: ProjectCalendarProps) {
  const [popup, setPopup] = useState<{ schedule: Schedule; position: { x: number; y: number } } | null>(null)

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
    setPopup({ schedule: newSchedule, position: { x: e.clientX, y: e.clientY } })
  }

  const handleScheduleClick = (s: Schedule, e: React.MouseEvent) => {
    e.stopPropagation()
    setPopup({ schedule: s, position: { x: e.clientX, y: e.clientY } })
  }

  return (
    <>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E5E5E5',
          borderRadius: 12,
          padding: 20,
          flex: 1,
        }}
      >
        {/* Navigation */}
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <button
            onClick={prevMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontSize: 18, padding: '0 4px' }}
          >
            ‹
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>
            {year}년 {month}월
          </span>
          <button
            onClick={nextMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontSize: 18, padding: '0 4px' }}
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              style={{
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 500,
                color: i === 0 ? '#EF4444' : i === 6 ? '#3B5BDB' : '#6B6B6B',
                paddingBottom: 8,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
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
                style={{
                  minHeight: 64,
                  padding: '4px 3px',
                  background: !cell.currentMonth ? '#F8F8F8' : 'transparent',
                  borderRadius: 4,
                  position: 'relative',
                  cursor: cell.currentMonth ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: isToday
                      ? '#ffffff'
                      : !cell.currentMonth
                      ? '#D0D0D0'
                      : colIdx === 0
                      ? '#EF4444'
                      : colIdx === 6
                      ? '#3B5BDB'
                      : '#1A1A1A',
                    fontWeight: isToday ? 700 : 400,
                    textAlign: 'center',
                    width: 20,
                    height: 20,
                    lineHeight: '20px',
                    borderRadius: '50%',
                    background: isToday ? '#3B5BDB' : 'transparent',
                    margin: '0 auto 2px',
                  }}
                >
                  {cell.day}
                </div>
                {daySchedules.slice(0, 2).map(s => (
                  <div
                    key={s.id}
                    onClick={e => handleScheduleClick(s, e)}
                    style={{
                      fontSize: 10,
                      background: '#dcfce7',
                      color: '#008236',
                      borderRadius: 3,
                      padding: '1px 4px',
                      marginBottom: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                    title={s.title}
                  >
                    {s.title}
                  </div>
                ))}
                {daySchedules.length > 2 && (
                  <div style={{ fontSize: 10, color: '#9E9E9E' }}>
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
          position={popup.position}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  )
}
