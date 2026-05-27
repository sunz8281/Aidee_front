'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient } from '@/lib/axios'
import { useTokenStore } from '@/store/tokenStore'

const PUBLIC_PATHS = ['/login', '/share/']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const { setAccessToken } = useTokenStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isPublic) {
      setReady(true)
      return
    }

    if (ready) return

    // OAuth 리다이렉트 후 URL에서 access_token 추출
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('access_token')
    if (urlToken) {
      setAccessToken(urlToken)
      params.delete('access_token')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname
      window.history.replaceState({}, '', newUrl)
      setReady(true)
      return
    }

    // 메모리에 토큰 없으면 silent refresh 시도
    apiClient.post<{ access_token: string }>('/auth/refresh')
      .then(res => {
        setAccessToken(res.data.access_token)
        setReady(true)
      })
      .catch(() => router.replace('/login'))
  }, [isPublic, ready, router, setAccessToken])

  if (!ready) return null
  return <>{children}</>
}
