import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', style, ...props }: InputProps) {
  return (
    <input
      className={`outline-none transition-colors ${className}`}
      style={{
        border: '1px solid #E5E5E5',
        borderRadius: 8,
        padding: '0 12px',
        height: 36,
        fontSize: 14,
        color: '#1A1A1A',
        background: '#ffffff',
        width: '100%',
        ...style,
      }}
      {...props}
    />
  )
}
