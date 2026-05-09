'use client'

import { IconAgent } from '@/components/icons'

interface AgentButtonProps {
  onClick: () => void
}

export function AgentButton({ onClick }: AgentButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: '#ffffff',
        border: '1px solid #E5E5E5',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 6px 20px rgba(0,0,0,0.18)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 4px 12px rgba(0,0,0,0.12)'
      }}
      title="AI 에이전트"
    >
      <IconAgent width={24} height={24} />
    </button>
  )
}
