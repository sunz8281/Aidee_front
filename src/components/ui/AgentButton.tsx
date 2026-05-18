'use client'

import { IconAgent } from '@/components/icons'

interface AgentButtonProps {
  onClick: () => void
}

export function AgentButton({ onClick }: AgentButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-[63px] h-[63px] rounded-full bg-card border border-border shadow-[0_4px_12px_rgba(0,0,0,0.12)] cursor-pointer flex items-center justify-center z-50 transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)]"
      title="AI 에이전트"
    >
      <IconAgent width={28} height={28} />
    </button>
  )
}
