'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

const PUBLIC_PATHS = ['/login', '/share/']

interface AuthMeResponse {
  id: string
  email: string
  name: string
  pictureUrl: string
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const { isLoggedIn, setLoggedIn } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isPublic) {
      setReady(true)
      return
    }

    if (isLoggedIn) {
      setReady(true)
      return
    }

    apiClient.get<AuthMeResponse>('/auth/me')
      .then(res => {
        setLoggedIn(true, res.data)
        setReady(true)
      })
      .catch(() => {
        setLoggedIn(false)
        router.replace('/login')
      })
  }, [isPublic, isLoggedIn, router, setLoggedIn])

  if (!ready) return null
  return <>{children}</>
}
