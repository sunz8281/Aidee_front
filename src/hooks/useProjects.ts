'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { ProjectsResponse, CreateProjectResponse, Project, SharedProject } from '@/types'

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: async () => {
      const res = await apiClient.get<ProjectsResponse>('/projects')
      return res.data
    },
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.project(projectId),
    queryFn: async () => {
      const res = await apiClient.get<Project>(`/projects/${projectId}`)
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<CreateProjectResponse>('/projects')
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.projects })
    },
  })
}

export function useUpdateProjectTitle(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      await apiClient.patch(`/projects/${projectId}/title`, { name })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.projects })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId: string) => {
      await apiClient.delete(`/projects/${projectId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.projects })
    },
  })
}

export function useEnableShare(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ shareToken: string }>(`/projects/${projectId}/share`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) })
    },
  })
}

export function useDisableShare(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/projects/${projectId}/share`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) })
    },
  })
}

export function useSharedProject(shareToken: string) {
  return useQuery({
    queryKey: QUERY_KEYS.sharedProject(shareToken),
    queryFn: async () => {
      const res = await apiClient.get<SharedProject>(`/share/${shareToken}`)
      return res.data
    },
    enabled: !!shareToken,
    retry: false,
  })
}
