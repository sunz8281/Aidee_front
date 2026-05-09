import Link from 'next/link'
import { IconLogo } from '@/components/icons'

interface HeaderProps {
  rightSlot?: React.ReactNode
}

export function Header({ rightSlot }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 h-[68px] bg-card border-b border-border">
      <Link href="/" className="flex items-center">
        <IconLogo width={120} height={37} />
      </Link>
      {rightSlot && <div>{rightSlot}</div>}
    </header>
  )
}
