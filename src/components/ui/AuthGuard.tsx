'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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
    // 쿠키 기반 인증 — 쿠키가 있으면 바로 통과.
    // 실제 인증 여부는 API 401 응답 시 axios 인터셉터가 /login으로 리다이렉트.
    setReady(true)
  }, [isPublic, router])

  if (!ready) return null
  return <>{children}</>
}
