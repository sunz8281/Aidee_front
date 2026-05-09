import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={[
        'w-full h-9 px-3 text-md text-text-primary bg-card border border-border rounded-md outline-none transition-colors',
        'focus:border-primary',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
