import type { Schedule } from './schedule'

export interface MeetingSummary {
  id: string
  title: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  summary: string | null
  meetingAt: string
  createdAt: string
}

export interface ScriptSegment {
  startTime: number
  contents: string
}

export interface Meeting {
  id: string
  title: string
  meetingAt: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  summary: string
  memo: string
  scripts: ScriptSegment[]
  schedules: Schedule[]
  audioUrl: string
  createdAt: string
}

export interface MeetingsResponse {
  items: MeetingSummary[]
}

export interface CreateMeetingResponse {
  id: string
  title: string
  meetingAt: string
  createdAt: string
}
