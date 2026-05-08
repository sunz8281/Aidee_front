'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { MemosResponse } from '@/types'

export function useMemos(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.memos(projectId),
    queryFn: async () => {
      const res = await apiClient.get<MemosResponse>(
        `/projects/${projectId}/memos`,
      )
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useUpdateMemo(meetingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (memo: string) => {
      await apiClient.patch(`/meetings/${meetingId}/memo`, { memo })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meetingId) })
      qc.invalidateQueries({ queryKey: ['memos'] })
    },
  })
}
