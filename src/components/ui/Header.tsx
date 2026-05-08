import Link from 'next/link'

interface HeaderProps {
  rightSlot?: React.ReactNode
}

export function Header({ rightSlot }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-8"
      style={{ height: 56, background: '#ffffff', borderBottom: '1px solid #E5E5E5' }}
    >
      <Link href="/" className="flex items-center">
        <span
          className="font-bold tracking-tight select-none"
          style={{
            background: '#3B5BDB',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 18,
            letterSpacing: '-0.5px',
          }}
        >
          Aidee
        </span>
      </Link>
      {rightSlot && <div>{rightSlot}</div>}
    </header>
  )
}
