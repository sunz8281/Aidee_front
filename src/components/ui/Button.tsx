import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variantClass: Record<string, string> = {
  primary:   'bg-primary text-white hover:bg-primary-hover border-none',
  secondary: 'bg-[#6B7280] text-white hover:bg-[#5a6270] border-none',
  danger:    'bg-danger text-white hover:bg-danger-hover border-none',
  ghost:     'bg-transparent border-none',
  outline:   'bg-transparent border border-border',
}

const sizeClass: Record<string, string> = {
  sm: 'px-3 h-7 text-sm rounded-[6px]',
  md: 'px-4 h-9 text-md rounded-md',
  lg: 'px-5 h-[42px] text-lg rounded-md',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-colors disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
