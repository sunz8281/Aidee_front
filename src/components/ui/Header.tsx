'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconLogo } from '@/components/icons'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

interface HeaderProps {
  rightSlot?: React.ReactNode
}

export function Header({ rightSlot }: HeaderProps) {
  const router = useRouter()
  const { isLoggedIn, setLoggedIn } = useAuthStore()

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {}
    setLoggedIn(false)
    router.replace('/login')
  }

  return (
    <header className="flex items-center justify-between px-8 h-[68px] bg-card border-b border-border">
      <Link href="/" className="flex items-center">
        <IconLogo width={120} height={37} />
      </Link>
      <div className="flex items-center gap-4">
        {rightSlot}
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="text-base text-text-tertiary bg-transparent border-none cursor-pointer hover:text-text-secondary transition-colors"
          >
            로그아웃
          </button>
        ) : (
          <Link href="/login" className="text-base text-primary font-medium no-underline hover:opacity-80">
            Aidee 시작하기 →
          </Link>
        )}
      </div>
    </header>
  )
}
