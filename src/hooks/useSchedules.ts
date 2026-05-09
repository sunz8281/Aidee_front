'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { SchedulesResponse, Schedule } from '@/types'

export function useSchedules(projectId: string, year: number, month: number) {
  return useQuery({
    queryKey: QUERY_KEYS.schedules(projectId, year, month),
    queryFn: async () => {
      const res = await apiClient.get<SchedulesResponse>(
        `/projects/${projectId}/schedules`,
        { params: { year, month } },
      )
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useCreateSchedule(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      title: string
      startTime: string
      endTime: string
      allDay: boolean
      sourceType?: Schedule['sourceType']
      sourceMeetingId?: string
    }) => {
      const res = await apiClient.post(`/projects/${projectId}/schedules`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules', projectId] })
    },
  })
}

export function useUpdateSchedule(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      title: string
      startTime: string
      endTime: string
      allDay: boolean
    }) => {
      const res = await apiClient.put(`/schedules/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules', projectId] })
    },
  })
}

export function useDeleteSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      await apiClient.delete(`/schedules/${scheduleId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}
