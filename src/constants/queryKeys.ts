export const QUERY_KEYS = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  meetings: (projectId: string) => ['meetings', projectId] as const,
  meeting: (id: string) => ['meeting', id] as const,
  schedules: (projectId: string, year: number, month: number) =>
    ['schedules', projectId, year, month] as const,
  memos: (projectId: string) => ['memos', projectId] as const,
}
