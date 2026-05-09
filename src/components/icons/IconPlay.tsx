import type { SVGProps } from 'react'

export function IconPlay(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    </svg>
  )
}
