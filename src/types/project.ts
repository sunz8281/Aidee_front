import type { MeetingSummary } from './meeting'
import type { Schedule } from './schedule'

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
  createdAt: string
}

export interface ProjectsResponse {
  items: ProjectSummary[]
}

export interface CreateProjectResponse {
  id: string
}
