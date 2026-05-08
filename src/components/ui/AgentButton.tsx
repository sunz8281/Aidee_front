'use client'

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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="3" fill="#3B5BDB" />
        <circle cx="9" cy="12" r="1.5" fill="white" />
        <circle cx="15" cy="12" r="1.5" fill="white" />
        <path d="M9 3h6M12 3v3" stroke="#3B5BDB" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 19v2M18 19v2" stroke="#3B5BDB" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}
