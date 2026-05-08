export interface ProjectSummary {
  id: string
  name: string
  createdAt: string
}

export interface ProjectsResponse {
  items: ProjectSummary[]
}

export interface CreateProjectResponse {
  id: string
}

export interface MeetingSummary {
  id: string
  title: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  meetingAt: string
  createdAt: string
}

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

export interface Project {
  id: string
  name: string
  meetings: MeetingSummary[]
  schedules: Schedule[]
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

export interface Memo {
  meetingId: string
  meetingTitle: string
  memo: string
}

export interface MemosResponse {
  items: Memo[]
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

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentActionPayload {
  type: 'schedule_added' | 'schedule_updated' | 'schedule_deleted' | 'memo_updated'
  payload: Record<string, unknown>
}
