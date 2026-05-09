export interface Schedule {
  id: string
  title: string
  startTime: string
  endTime: string
  allDay: boolean
  sourceType?: 'ai' | 'user' | 'agent'
  sourceMeetingId?: string
  createdAt: string
}

export interface SchedulesResponse {
  items: Schedule[]
}

export interface CreateScheduleResponse {
  id: string
  title: string
  startTime: string
  endTime: string
  createdAt: string
}

export interface UpdateScheduleResponse {
  id: string
  title: string
}
