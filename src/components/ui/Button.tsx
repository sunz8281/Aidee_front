import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles: Record<string, string> = {
  primary: 'text-white cursor-pointer transition-colors',
  secondary: 'text-white cursor-pointer transition-colors',
  danger: 'text-white cursor-pointer transition-colors',
  ghost: 'cursor-pointer transition-colors',
  outline: 'cursor-pointer transition-colors border',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  children,
  ...props
}: ButtonProps) {
  const sizeMap = {
    sm: { padding: '4px 12px', fontSize: 12, borderRadius: 6, height: 28 },
    md: { padding: '0 16px', fontSize: 14, borderRadius: 8, height: 36 },
    lg: { padding: '0 20px', fontSize: 15, borderRadius: 8, height: 42 },
  }
  const s = sizeMap[size]

  const bgMap: Record<string, string> = {
    primary: '#3B5BDB',
    secondary: '#6B7280',
    danger: '#EF4444',
    ghost: 'transparent',
    outline: 'transparent',
  }

  return (
    <button
      className={`${variantStyles[variant]} ${className} inline-flex items-center justify-center gap-1.5 font-medium`}
      style={{
        background: bgMap[variant],
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.borderRadius,
        height: s.height,
        border: variant === 'outline' ? '1px solid #E5E5E5' : 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
