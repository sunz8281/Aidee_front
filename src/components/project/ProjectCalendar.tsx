'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Schedule, MeetingSummary } from '@/types'
import { useCreateSchedule, useUpdateSchedule } from '@/hooks/useSchedules'
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
const RESIZE_HANDLE_ATTR = 'data-resize-handle'

// Bar layout constants
const BAR_TOP   = 24  // px from top of row (below day number)
const BAR_H     = 18  // bar height
const BAR_GAP   = 2   // gap between lanes
const MIN_ROW_H = 56  // minimum row height (even if 0 events)

function laneTop(lane: number) {
  return BAR_TOP + lane * (BAR_H + BAR_GAP)
}
function rowHeightForLanes(maxLane: number) {
  return Math.max(MIN_ROW_H, laneTop(maxLane + 1) + BAR_GAP)
}

// ─── Custom sensor ────────────────────────────────────────────────────────────

class CalendarPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }): boolean => {
        const target = nativeEvent.target as HTMLElement | null
        return !target?.closest(`[${RESIZE_HANDLE_ATTR}]`)
      },
    },
  ]
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BarSegment {
  schedule: Schedule
  startCol: number
  endCol: number
  row: number
  lane: number
  continueLeft: boolean
  continueRight: boolean
  isFirstInView: boolean
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function toMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function cellDate(cellIdx: number, year: number, month: number): Date {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  const daysInMonth = new Date(year, month, 0).getDate()
  const offset = cellIdx - firstDay
  if (offset < 0) return new Date(year, month - 2, daysInPrevMonth + offset + 1)
  if (offset >= daysInMonth) return new Date(year, month, offset - daysInMonth + 1)
  return new Date(year, month - 1, offset + 1)
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Format a Date as a local-time ISO string (no Z / no offset), matching the server's storage format. */
function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Two column ranges overlap if they share at least one column */
function colsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart <= bEnd && bStart <= aEnd
}

/**
 * Compute bar segments with lane assignment.
 * Lanes are assigned per row: each overlapping group of events gets stacked
 * vertically so they're all visible.
 */
function computeBarSegments(schedules: Schedule[], year: number, month: number): BarSegment[] {
  // Step 1: raw segments (no lane yet)
  interface RawSeg {
    schedule: Schedule
    startCol: number
    endCol: number
    row: number
    continueLeft: boolean
    continueRight: boolean
  }

  const raw: RawSeg[] = []
  schedules.forEach(schedule => {
    const startDate = toMidnight(new Date(schedule.startTime))
    const endDate   = toMidnight(new Date(schedule.endTime))

    for (let row = 0; row < 6; row++) {
      const rowStartDate = toMidnight(cellDate(row * 7,     year, month))
      const rowEndDate   = toMidnight(cellDate(row * 7 + 6, year, month))

      if (startDate > rowEndDate || endDate < rowStartDate) continue

      const segStart = startDate < rowStartDate ? rowStartDate : startDate
      const segEnd   = endDate   > rowEndDate   ? rowEndDate   : endDate

      raw.push({
        schedule,
        startCol: Math.round((segStart.getTime() - rowStartDate.getTime()) / 86400000),
        endCol:   Math.round((segEnd.getTime()   - rowStartDate.getTime()) / 86400000),
        row,
        continueLeft:  startDate < rowStartDate,
        continueRight: endDate   > rowEndDate,
      })
    }
  })

  // Determine first visible row per schedule
  const firstRowInView = new Map<string, number>()
  for (const seg of raw) {
    const prev = firstRowInView.get(seg.schedule.id)
    if (prev === undefined || seg.row < prev) firstRowInView.set(seg.schedule.id, seg.row)
  }

  // Step 2: assign lanes per row (greedy, first-fit)
  const result: BarSegment[] = []

  for (let row = 0; row < 6; row++) {
    const rowSegs = raw.filter(s => s.row === row)
    // sort: wider (longer) events first → they claim lower lanes
    rowSegs.sort((a, b) => (b.endCol - b.startCol) - (a.endCol - a.startCol) || a.startCol - b.startCol)

    const assigned: BarSegment[] = []
    for (const seg of rowSegs) {
      let lane = 0
      while (assigned.some(a => a.lane === lane && colsOverlap(a.startCol, a.endCol, seg.startCol, seg.endCol))) {
        lane++
      }
      const s = { ...seg, lane, isFirstInView: firstRowInView.get(seg.schedule.id) === row }
      assigned.push(s)
      result.push(s)
    }
  }

  return result
}

// ─── ScheduleBar ─────────────────────────────────────────────────────────────

interface ScheduleBarProps {
  segment: BarSegment
  onResizeStart: (scheduleId: string, side: 'left' | 'right', e: React.PointerEvent) => void
  onClick: (s: Schedule, e: React.MouseEvent) => void
  isDragging: boolean
}

function ScheduleBar({ segment, onResizeStart, onClick, isDragging }: ScheduleBarProps) {
  const { schedule, startCol, endCol, lane, continueLeft, continueRight, isFirstInView } = segment
  const colSpan = endCol - startCol + 1

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `bar-${schedule.id}-${segment.row}-${startCol}`,
    data: { schedule, type: 'bar' },
  })

  const style: React.CSSProperties = {
    left:      `calc(${(startCol / 7) * 100}% + 2px)`,
    width:     `calc(${(colSpan  / 7) * 100}% - 4px)`,
    top:       laneTop(lane),
    height:    BAR_H,
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.25 : 1,
    position:  'absolute',
    zIndex:    isDragging ? 0 : 10,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center select-none',
        'bg-schedule-chip text-schedule-chip-text text-[10px] font-medium',
        !continueLeft  ? 'rounded-l-[3px]' : '',
        !continueRight ? 'rounded-r-[3px]' : '',
        'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      onClick={e => { e.stopPropagation(); onClick(schedule, e) }}
      {...attributes}
      {...listeners}
    >
      {!continueLeft && (
        <div
          {...{ [RESIZE_HANDLE_ATTR]: 'left' }}
          className="w-2 h-full flex-shrink-0 cursor-col-resize"
          onPointerDown={e => { e.stopPropagation(); onResizeStart(schedule.id, 'left', e) }}
        />
      )}
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-0.5 pointer-events-none">
        {isFirstInView && schedule.title}
      </span>
      {!continueRight && (
        <div
          {...{ [RESIZE_HANDLE_ATTR]: 'right' }}
          className="w-2 h-full flex-shrink-0 cursor-col-resize"
          onPointerDown={e => { e.stopPropagation(); onResizeStart(schedule.id, 'right', e) }}
        />
      )}
    </div>
  )
}

// ─── GhostBar: drag-move preview ─────────────────────────────────────────────

function GhostBar({ segment }: { segment: BarSegment }) {
  const { startCol, endCol, lane, continueLeft, continueRight, isFirstInView, schedule } = segment
  const colSpan = endCol - startCol + 1
  return (
    <div
      style={{
        position: 'absolute',
        top:    laneTop(lane),
        height: BAR_H,
        left:   `calc(${(startCol / 7) * 100}% + 2px)`,
        width:  `calc(${(colSpan  / 7) * 100}% - 4px)`,
        zIndex: 9,
        pointerEvents: 'none',
      }}
      className={[
        'flex items-center',
        'bg-primary/20 border border-primary/60 border-dashed',
        'text-primary text-[10px] font-medium',
        !continueLeft  ? 'rounded-l-[3px]' : '',
        !continueRight ? 'rounded-r-[3px]' : '',
      ].join(' ')}
    >
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-1">
        {isFirstInView && schedule.title}
      </span>
    </div>
  )
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  cellIdx: number
  day: number
  currentMonth: boolean
  isToday: boolean
  colIdx: number
  height: number
  onDayClick: (e: React.MouseEvent) => void
}

function DayCell({ cellIdx, day, currentMonth, isToday, colIdx, height, onDayClick }: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${cellIdx}`, data: { cellIdx } })

  return (
    <div
      ref={setNodeRef}
      style={{ height }}
      onClick={currentMonth ? onDayClick : undefined}
      className={[
        'p-[4px_3px] rounded-sm transition-colors',
        currentMonth ? 'cursor-pointer' : 'cursor-default bg-surface',
        isOver && currentMonth ? 'bg-primary/10' : '',
      ].join(' ')}
    >
      <div
        className={[
          'text-sm text-center w-5 h-5 leading-5 rounded-full mx-auto',
          isToday
            ? 'text-white font-bold bg-primary'
            : !currentMonth
            ? 'text-[#D0D0D0]'
            : colIdx === 0
            ? 'text-danger'
            : colIdx === 6
            ? 'text-primary'
            : 'text-text-primary',
        ].join(' ')}
      >
        {day}
      </div>
    </div>
  )
}

// ─── ProjectCalendar ──────────────────────────────────────────────────────────

export function ProjectCalendar({
  projectId,
  schedules,
  meetings,
  year,
  month,
  onMonthChange,
}: ProjectCalendarProps) {
  const [popup, setPopup] = useState<{
    schedule: Schedule
    position: { x: number; y: number }
    initialMode: 'view' | 'edit'
  } | null>(null)
  const [activeDragSchedule, setActiveDragSchedule] = useState<Schedule | null>(null)
  const [dragOverCellIdx, setDragOverCellIdx] = useState<number | null>(null)
  const [resizePreview, setResizePreview] = useState<{
    scheduleId: string
    side: 'left' | 'right'
    dayDelta: number
  } | null>(null)

  const resizeRef = useRef<{
    scheduleId: string
    side: 'left' | 'right'
    originalStart: Date
    originalEnd: Date
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const createSchedule = useCreateSchedule(projectId)
  const updateSchedule = useUpdateSchedule(projectId)

  const sensors = useSensors(
    useSensor(CalendarPointerSensor, { activationConstraint: { distance: 6 } })
  )

  // ── Grid cells ───────────────────────────────────────────────────────────

  const cells = useMemo(() => {
    const firstDay      = new Date(year, month - 1, 1).getDay()
    const daysInMonth   = new Date(year, month, 0).getDate()
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
    const arr: Array<{ day: number; currentMonth: boolean }> = []
    for (let i = 0; i < firstDay; i++) arr.push({ day: daysInPrevMonth - firstDay + 1 + i, currentMonth: false })
    for (let d = 1; d <= daysInMonth; d++) arr.push({ day: d, currentMonth: true })
    const remaining = 42 - arr.length
    for (let d = 1; d <= remaining; d++) arr.push({ day: d, currentMonth: false })
    return arr
  }, [year, month])

  const today = new Date()

  // ── Segment memos ─────────────────────────────────────────────────────────

  /** Display segments: real data + resize preview applied → with lane assignment */
  const displaySegments = useMemo<BarSegment[]>(() => {
    const effective = (resizePreview && resizePreview.dayDelta !== 0)
      ? schedules.map(s => {
          if (s.id !== resizePreview.scheduleId) return s
          let newStart = new Date(s.startTime)
          let newEnd   = new Date(s.endTime)
          if (resizePreview.side === 'left') {
            newStart = new Date(newStart.getTime() + resizePreview.dayDelta * 86400000)
            if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 86400000)
          } else {
            newEnd = new Date(newEnd.getTime() + resizePreview.dayDelta * 86400000)
            if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 86400000)
          }
          return { ...s, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
        })
      : schedules
    return computeBarSegments(effective, year, month)
  }, [schedules, year, month, resizePreview])

  /** Ghost segments: where dragged event would land, placed in a fitting lane */
  const ghostSegments = useMemo<BarSegment[]>(() => {
    if (!activeDragSchedule || dragOverCellIdx === null) return []
    const targetDate = cellDate(dragOverCellIdx, year, month)
    const origStart  = new Date(activeDragSchedule.startTime)
    const origEnd    = new Date(activeDragSchedule.endTime)
    const durationMs = origEnd.getTime() - origStart.getTime()
    const newStart   = new Date(targetDate)
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds())
    const newEnd = new Date(newStart.getTime() + durationMs)

    // Compute raw ghost segs (no lane yet)
    const ghostRaw = computeBarSegments(
      [{ ...activeDragSchedule, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }],
      year, month,
    )

    // Assign lane: find first free lane per row, considering other events in displaySegments
    return ghostRaw.map(ghost => {
      const rowSegs = displaySegments.filter(
        s => s.row === ghost.row && s.schedule.id !== activeDragSchedule.id
      )
      let lane = 0
      while (rowSegs.some(s => s.lane === lane && colsOverlap(s.startCol, s.endCol, ghost.startCol, ghost.endCol))) {
        lane++
      }
      return { ...ghost, lane }
    })
  }, [activeDragSchedule, dragOverCellIdx, year, month, displaySegments])

  /** Per-row heights derived from max lane */
  const rowHeights = useMemo(() => {
    return Array.from({ length: 6 }, (_, r) => {
      const segs = displaySegments.filter(s => s.row === r)
      const maxLane = segs.length ? Math.max(...segs.map(s => s.lane)) : 0
      return rowHeightForLanes(maxLane)
    })
  }, [displaySegments])

  // ── Custom collision detection ────────────────────────────────────────────
  // pointerWithin / rectIntersection both fail near cell borders and gaps.
  // This maps the raw pointer coordinates to a row (by cumulative height) and
  // column (by equal 7-column division), then returns the matching droppable.
  const collisionStateRef = useRef(rowHeights)
  collisionStateRef.current = rowHeights

  const calendarCollision = useCallback<CollisionDetection>(
    ({ droppableContainers, pointerCoordinates }) => {
      if (!pointerCoordinates || !containerRef.current) return []

      const rect = containerRef.current.getBoundingClientRect()
      const relX = pointerCoordinates.x - rect.left
      const relY = pointerCoordinates.y - rect.top

      if (relX < 0 || relX > rect.width || relY < 0 || relY > rect.height) return []

      // Rows are separated by gap-0.5 = 2px
      const ROW_GAP = 2
      const rh = collisionStateRef.current
      let row = -1
      let cumY = 0
      for (let r = 0; r < 6; r++) {
        if (relY < cumY + rh[r]) { row = r; break }
        cumY += rh[r] + ROW_GAP
      }
      if (row === -1) return []

      // 7 equal columns (ignore sub-pixel gaps for robustness)
      const col = Math.min(6, Math.floor(relX / (rect.width / 7)))
      const cellIdx = row * 7 + col
      const droppable = droppableContainers.find(d => d.id === `cell-${cellIdx}`)
      return droppable ? [{ id: droppable.id, data: droppable }] : []
    },
    [],
  )

  // ── Handlers ─────────────────────────────────────────────────────────────

  const prevMonth = () => { if (month === 1) onMonthChange(year - 1, 12); else onMonthChange(year, month - 1) }
  const nextMonth = () => { if (month === 12) onMonthChange(year + 1, 1); else onMonthChange(year, month + 1) }

  const handleDayClick = async (day: number, e: React.MouseEvent) => {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`
    const created = await createSchedule.mutateAsync({
      title: '새 일정',
      startTime: `${dateStr}T09:00:00`,
      endTime: `${dateStr}T10:00:00`,
      allDay: false,
    })
    const newSchedule: Schedule = {
      ...created, allDay: false,
      createdAt: created.createdAt ?? new Date().toISOString(),
    }
    setPopup({ schedule: newSchedule, position: { x: e.clientX, y: e.clientY }, initialMode: 'edit' })
  }

  const handleScheduleClick = (s: Schedule, e: React.MouseEvent) => {
    e.stopPropagation()
    setPopup({ schedule: s, position: { x: e.clientX, y: e.clientY }, initialMode: 'view' })
  }

  // Ref that always holds the latest hovered cellIdx during drag.
  // Updated synchronously in onDragOver AND via a capture-phase pointerup
  // listener so handleDragEnd always reads the exact release cell.
  const dragOverCellIdxRef = useRef<number | null>(null)

  // Convert raw client coords to a cellIdx (same math as calendarCollision)
  const clientToCellIdx = useCallback((clientX: number, clientY: number): number | null => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    const relX = clientX - rect.left
    const relY = clientY - rect.top
    if (relX < 0 || relX > rect.width || relY < 0 || relY > rect.height) return null
    const ROW_GAP = 2
    const rh = collisionStateRef.current
    let row = -1, cumY = 0
    for (let r = 0; r < 6; r++) {
      if (relY < cumY + rh[r]) { row = r; break }
      cumY += rh[r] + ROW_GAP
    }
    if (row === -1) return null
    return row * 7 + Math.min(6, Math.floor(relX / (rect.width / 7)))
  }, [])

  const handleDragStart = useCallback(({ active }: { active: { data: { current?: { schedule?: Schedule; type?: string } } } }) => {
    if (active.data.current?.type === 'bar') {
      setActiveDragSchedule(active.data.current.schedule ?? null)
      // Capture-phase pointerup fires before @dnd-kit processes the event,
      // so we get the exact release coordinates and override the ref.
      const onPointerUp = (e: PointerEvent) => {
        const idx = clientToCellIdx(e.clientX, e.clientY)
        if (idx !== null) dragOverCellIdxRef.current = idx
        document.removeEventListener('pointerup', onPointerUp, { capture: true })
      }
      document.addEventListener('pointerup', onPointerUp, { capture: true })
    }
  }, [clientToCellIdx])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const idx = event.over?.data.current?.cellIdx
    const cellIdx = typeof idx === 'number' ? idx : null
    dragOverCellIdxRef.current = cellIdx   // sync ref for handleDragEnd
    setDragOverCellIdx(cellIdx)             // async state for ghost bar render
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event
    // Read ref immediately before any state changes
    const refAtEntry = dragOverCellIdxRef.current
    const overCellIdx = typeof event.over?.data.current?.cellIdx === 'number'
      ? (event.over.data.current.cellIdx as number) : null

    setActiveDragSchedule(null)
    setDragOverCellIdx(null)

    const targetCellIdx = refAtEntry ?? overCellIdx
    dragOverCellIdxRef.current = null
    if (!active.data.current || targetCellIdx === null) return

    const schedule   = active.data.current.schedule as Schedule
    const targetDate = cellDate(targetCellIdx, year, month)
    const origStart  = new Date(schedule.startTime)
    const origEnd    = new Date(schedule.endTime)
    const newStart   = new Date(targetDate)
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds())
    const newEnd = new Date(newStart.getTime() + (origEnd.getTime() - origStart.getTime()))

    updateSchedule.mutate({
      id: schedule.id, title: schedule.title,
      startTime: toLocalISO(newStart), endTime: toLocalISO(newEnd),
      allDay: schedule.allDay, meetingId: schedule.meetingId ?? undefined,
    })
  }, [year, month, updateSchedule])

  const handleDragCancel = useCallback(() => {
    setActiveDragSchedule(null)
    setDragOverCellIdx(null)
    dragOverCellIdxRef.current = null
  }, [])

  const handleResizeStart = useCallback((
    scheduleId: string,
    side: 'left' | 'right',
    e: React.PointerEvent,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const schedule = schedules.find(s => s.id === scheduleId)
    if (!schedule || !containerRef.current) return

    resizeRef.current = {
      scheduleId, side,
      originalStart: new Date(schedule.startTime),
      originalEnd:   new Date(schedule.endTime),
    }

    // Compute how many days the cursor is from the original anchor date.
    // Uses cell-based (X + Y) positioning so dragging across row boundaries works.
    const getDayDelta = (clientX: number, clientY: number): number | null => {
      if (!resizeRef.current) return null
      const idx = clientToCellIdx(clientX, clientY)
      if (idx === null) return null
      const targetDate = toMidnight(cellDate(idx, year, month))
      const refDate = side === 'left'
        ? toMidnight(resizeRef.current.originalStart)
        : toMidnight(resizeRef.current.originalEnd)
      return Math.round((targetDate.getTime() - refDate.getTime()) / 86400000)
    }

    const onMove = (ev: PointerEvent) => {
      const delta = getDayDelta(ev.clientX, ev.clientY)
      if (delta !== null) setResizePreview({ scheduleId, side, dayDelta: delta })
    }

    const onUp = (ev: PointerEvent) => {
      if (!resizeRef.current) return
      const { side: s, originalStart, originalEnd } = resizeRef.current
      const dayDelta = getDayDelta(ev.clientX, ev.clientY) ?? 0

      if (dayDelta !== 0) {
        const sc = schedules.find(x => x.id === scheduleId)
        if (sc) {
          let newStart = new Date(originalStart)
          let newEnd   = new Date(originalEnd)
          if (s === 'left') {
            newStart = new Date(originalStart.getTime() + dayDelta * 86400000)
            if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 86400000)
          } else {
            newEnd = new Date(originalEnd.getTime() + dayDelta * 86400000)
            if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 86400000)
          }
          updateSchedule.mutate({
            id: sc.id, title: sc.title,
            startTime: toLocalISO(newStart), endTime: toLocalISO(newEnd),
            allDay: sc.allDay, meetingId: sc.meetingId ?? undefined,
          })
        }
      }

      setResizePreview(null)
      resizeRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [schedules, updateSchedule, clientToCellIdx, year, month])

  // ── Render ───────────────────────────────────────────────────────────────

  const rows = Array.from({ length: 6 }, (_, r) => cells.slice(r * 7, r * 7 + 7))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={calendarCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
        <div ref={containerRef} className="flex flex-col gap-0.5">
          {rows.map((week, rowIdx) => {
            const rowH       = rowHeights[rowIdx]
            const rowDisplay = displaySegments.filter(s => s.row === rowIdx)
            const rowGhost   = ghostSegments.filter(s => s.row === rowIdx)

            return (
              <div key={rowIdx} className="relative" style={{ height: rowH }}>
                {/* Day cells */}
                <div className="absolute inset-0 grid grid-cols-7 gap-0.5">
                  {week.map((cell, colIdx) => {
                    const cellIdx = rowIdx * 7 + colIdx
                    const isToday =
                      cell.currentMonth &&
                      today.getFullYear() === year &&
                      today.getMonth() + 1 === month &&
                      today.getDate() === cell.day
                    return (
                      <DayCell
                        key={colIdx}
                        cellIdx={cellIdx}
                        day={cell.day}
                        currentMonth={cell.currentMonth}
                        isToday={isToday}
                        colIdx={colIdx}
                        height={rowH}
                        onDayClick={e => handleDayClick(cell.day, e)}
                      />
                    )
                  })}
                </div>

                {/* Normal bars */}
                <div className="absolute inset-0 pointer-events-none">
                  {rowDisplay.map(seg => (
                    <div key={`${seg.schedule.id}-r${seg.row}-c${seg.startCol}`} className="pointer-events-auto">
                      <ScheduleBar
                        segment={seg}
                        onResizeStart={handleResizeStart}
                        onClick={handleScheduleClick}
                        isDragging={activeDragSchedule?.id === seg.schedule.id}
                      />
                    </div>
                  ))}
                </div>

                {/* Ghost bars */}
                {rowGhost.map(seg => (
                  <GhostBar key={`ghost-${seg.schedule.id}-r${seg.row}-c${seg.startCol}`} segment={seg} />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragSchedule && (
          <div className="bg-schedule-chip text-schedule-chip-text text-[10px] font-medium rounded-[3px] px-2 h-[18px] flex items-center shadow-md opacity-90">
            {activeDragSchedule.title}
          </div>
        )}
      </DragOverlay>

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
    </DndContext>
  )
}
