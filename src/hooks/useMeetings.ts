'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type {
  MeetingsResponse,
  Meeting,
  CreateMeetingResponse,
} from '@/types'

export function useMeetings(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.meetings(projectId),
    queryFn: async () => {
      const res = await apiClient.get<MeetingsResponse>(
        `/projects/${projectId}/meetings`,
      )
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useMeeting(meetingId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.meeting(meetingId),
    queryFn: async () => {
      const res = await apiClient.get<Meeting>(`/meetings/${meetingId}`)
      return res.data
    },
    enabled: !!meetingId,
  })
}

export function useCreateMeeting(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { title?: string; meetingAt?: string } = {}) => {
      const res = await apiClient.post<CreateMeetingResponse>(
        `/projects/${projectId}/meetings`,
        params ?? {},
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.meetings(projectId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) })
    },
  })
}

export function useUpdateMeeting(meetingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { title?: string; meetingAt?: string }) => {
      await apiClient.patch(`/meetings/${meetingId}`, params)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meetingId) })
    },
  })
}

export function useDeleteMeeting(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (meetingId: string) => {
      await apiClient.delete(`/meetings/${meetingId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.meetings(projectId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) })
    },
  })
}
