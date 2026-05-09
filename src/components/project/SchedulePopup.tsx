'use client'

import { useState, useEffect, useRef } from 'react'
import { useUpdateSchedule, useDeleteSchedule } from '@/hooks/useSchedules'
import { IconCheck, IconTrash } from '@/components/icons'
import type { Schedule } from '@/types'

interface SchedulePopupProps {
  schedule: Schedule
  projectId: string
  position: { x: number; y: number }
  onClose: () => void
}

const POPUP_W = 240
const POPUP_H = 210

function toInputValue(iso: string, allDay: boolean) {
  return allDay ? iso.slice(0, 10) : iso.slice(0, 16)
}

function toIso(value: string, allDay: boolean, isEnd: boolean) {
  if (allDay) return isEnd ? `${value}T23:59:59` : `${value}T00:00:00`
  return value.length === 16 ? `${value}:00` : value
}

export function SchedulePopup({ schedule, projectId, position, onClose }: SchedulePopupProps) {
  const [title, setTitle] = useState(schedule.title)
  const [allDay, setAllDay] = useState(schedule.allDay)
  const [startVal, setStartVal] = useState(toInputValue(schedule.startTime, schedule.allDay))
  const [endVal, setEndVal] = useState(toInputValue(schedule.endTime, schedule.allDay))

  const update = useUpdateSchedule(projectId)
  const del = useDeleteSchedule()
  const popupRef = useRef<HTMLDivElement>(null)

  const x = Math.min(position.x + 8, window.innerWidth - POPUP_W - 8)
  const y = Math.min(position.y, window.innerHeight - POPUP_H - 8)

  const handleSave = async () => {
    await update.mutateAsync({
      id: schedule.id,
      title,
      allDay,
      startTime: toIso(startVal, allDay, false),
      endTime: toIso(endVal, allDay, true),
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

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: POPUP_W,
        background: '#ffffff',
        border: '1px solid #004fff',
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        padding: '10px 14px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header: title + save */}
      <div className="flex items-center justify-between gap-2">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 700,
            color: '#000000',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
          }}
        />
        <button
          onClick={handleSave}
          disabled={update.isPending}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <IconCheck width={16} height={16} className="text-primary" />
        </button>
      </div>

      {/* All-day */}
      <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={allDay}
          onChange={e => handleAllDayChange(e.target.checked)}
          style={{ width: 12, height: 12, accentColor: '#004fff', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12, color: allDay ? '#000000' : '#808080' }}>
          하루 종일
        </span>
      </label>

      {/* Date/time */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <input
          type={allDay ? 'date' : 'datetime-local'}
          value={startVal}
          onChange={e => setStartVal(e.target.value)}
          style={{ fontSize: 11, color: '#808080', border: 'none', outline: 'none', background: 'transparent', padding: 0, width: '100%' }}
        />
        <span style={{ fontSize: 11, color: '#c0c0c0' }}>~</span>
        <input
          type={allDay ? 'date' : 'datetime-local'}
          value={endVal}
          onChange={e => setEndVal(e.target.value)}
          style={{ fontSize: 11, color: '#808080', border: 'none', outline: 'none', background: 'transparent', padding: 0, width: '100%' }}
        />
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={del.isPending}
        className="flex items-center gap-1"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: 11,
          alignSelf: 'flex-start',
        }}
      >
        <IconTrash width={11} height={11} className="text-danger" />
        <span className="text-danger">삭제</span>
      </button>
    </div>
  )
}
