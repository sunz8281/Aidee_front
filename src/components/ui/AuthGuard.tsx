'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient } from '@/lib/axios'

const PUBLIC_PATHS = ['/login']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const [ready, setReady] = useState(isPublic)

  useEffect(() => {
    if (isPublic) {
      setReady(true)
      return
    }
    apiClient.get('/projects')
      .then(() => setReady(true))
      .catch(() => {
        // 401은 axios 인터셉터가 /login으로 리다이렉트 처리
      })
  }, [isPublic, router])

  if (!ready) return null
  return <>{children}</>
}
