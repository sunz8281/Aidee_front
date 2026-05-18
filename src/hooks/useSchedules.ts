'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { SchedulesResponse, Schedule } from '@/types'

export function useSchedules(projectId: string, from: string, to: string) {
  return useQuery({
    queryKey: QUERY_KEYS.schedules(projectId, from, to),
    queryFn: async () => {
      const res = await apiClient.get<SchedulesResponse>(
        `/projects/${projectId}/schedules`,
        { params: { from, to } },
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
      meetingId?: string
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
      meetingId?: string | null
    }) => {
      const res = await apiClient.put(`/schedules/${id}`, data)
      return res.data
    },
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ['schedules', projectId] })

      // Snapshot all month caches for this project (schedule can span months)
      const previousData = qc.getQueriesData<SchedulesResponse>({ queryKey: ['schedules', projectId] })

      previousData.forEach(([queryKey, cached]) => {
        if (!cached) return
        qc.setQueryData<SchedulesResponse>(queryKey, {
          items: cached.items.map(s => s.id === id ? { ...s, ...data } : s),
        })
      })

      return { previousData }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previousData.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
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
