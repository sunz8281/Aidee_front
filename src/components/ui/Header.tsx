'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconLogo } from '@/components/icons'
import { apiClient } from '@/lib/axios'
import { useTokenStore } from '@/store/tokenStore'

interface HeaderProps {
  rightSlot?: React.ReactNode
}

export function Header({ rightSlot }: HeaderProps) {
  const router = useRouter()
  const { setAccessToken } = useTokenStore()

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {}
    setAccessToken(null)
    router.replace('/login')
  }

  return (
    <header className="flex items-center justify-between px-8 h-[68px] bg-card border-b border-border">
      <Link href="/" className="flex items-center">
        <IconLogo width={120} height={37} />
      </Link>
      <div className="flex items-center gap-4">
        {rightSlot}
        <button
          onClick={handleLogout}
          className="text-base text-text-tertiary bg-transparent border-none cursor-pointer hover:text-text-secondary transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
