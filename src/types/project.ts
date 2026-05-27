import type { MeetingSummary } from './meeting'
import type { Schedule } from './schedule'
import type { Memo } from './memo'

export interface ProjectSummary {
  id: string
  name: string
  meetingsCount: number
  schedulesCount: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  meetings: MeetingSummary[]
  schedules: Schedule[]
  shareToken: string | null
  createdAt: string
}

export interface SharedProject {
  id: string
  name: string
  meetings: MeetingSummary[]
  memos: Memo[]
  shareToken: string
}

export interface ProjectsResponse {
  items: ProjectSummary[]
}

export interface CreateProjectResponse {
  id: string
}
