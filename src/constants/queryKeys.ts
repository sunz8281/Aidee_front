export const QUERY_KEYS = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  meetings: (projectId: string) => ['meetings', projectId] as const,
  meeting: (id: string) => ['meeting', id] as const,
  schedules: (projectId: string, from: string, to: string) =>
    ['schedules', projectId, from, to] as const,
  memos: (projectId: string) => ['memos', projectId] as const,
  sharedProject: (shareToken: string) => ['share', shareToken] as const,
}
