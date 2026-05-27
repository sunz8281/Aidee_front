'use client'

import { useMemo } from 'react'
import type { MeetingSummary } from '@/types'

interface SharedCalendarProps {
  meetings: MeetingSummary[]
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function SharedCalendar({ meetings, year, month, onMonthChange }: SharedCalendarProps) {
  const prevMonth = () => { if (month === 1) onMonthChange(year - 1, 12); else onMonthChange(year, month - 1) }
  const nextMonth = () => { if (month === 12) onMonthChange(year + 1, 1); else onMonthChange(year, month + 1) }

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
    const arr: Array<{ day: number; currentMonth: boolean }> = []
    for (let i = 0; i < firstDay; i++) arr.push({ day: daysInPrevMonth - firstDay + 1 + i, currentMonth: false })
    for (let d = 1; d <= daysInMonth; d++) arr.push({ day: d, currentMonth: true })
    const remaining = 42 - arr.length
    for (let d = 1; d <= remaining; d++) arr.push({ day: d, currentMonth: false })
    return arr
  }, [year, month])

  // Build a set of date strings that have meetings
  const meetingDates = useMemo(() => {
    const set = new Set<string>()
    meetings.forEach(m => {
      const dateStr = (m.meetingAt ?? m.createdAt).slice(0, 10)
      set.add(dateStr)
    })
    return set
  }, [meetings])

  const today = new Date()
  const rows = Array.from({ length: 6 }, (_, r) => cells.slice(r * 7, r * 7 + 7))

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex-1">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="bg-transparent border-none cursor-pointer text-text-secondary text-xl px-1">‹</button>
        <span className="text-lg font-semibold text-text-primary">{year}년 {month}월</span>
        <button onClick={nextMonth} className="bg-transparent border-none cursor-pointer text-text-secondary text-xl px-1">›</button>
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

      {/* Week rows */}
      <div className="flex flex-col gap-0.5">
        {rows.map((week, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-7 gap-0.5" style={{ minHeight: 56 }}>
            {week.map((cell, colIdx) => {
              const isToday =
                cell.currentMonth &&
                today.getFullYear() === year &&
                today.getMonth() + 1 === month &&
                today.getDate() === cell.day

              const dateStr = cell.currentMonth
                ? `${year}-${pad(month)}-${pad(cell.day)}`
                : null
              const hasMeeting = dateStr ? meetingDates.has(dateStr) : false

              return (
                <div key={colIdx} className={['p-[4px_3px] rounded-sm', !cell.currentMonth ? 'bg-surface' : ''].join(' ')}>
                  <div
                    className={[
                      'text-sm text-center w-5 h-5 leading-5 rounded-full mx-auto',
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
                  {hasMeeting && (
                    <div className="flex justify-center mt-0.5">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
