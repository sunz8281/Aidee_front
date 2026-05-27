'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const PUBLIC_PATHS = ['/login']

function hasAccessToken() {
  return document.cookie.split(';').some(c => c.trim().startsWith('access_token='))
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isPublic || hasAccessToken()) {
      setReady(true)
    } else {
      router.replace('/login')
    }
  }, [isPublic, router])

  if (!ready) return null
  return <>{children}</>
}
