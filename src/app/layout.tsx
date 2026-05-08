import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/lib/QueryProvider'

export const metadata: Metadata = {
  title: 'Aidee',
  description: 'AI 에이전트형 프로젝트 관리 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: '#F8F8F8' }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
