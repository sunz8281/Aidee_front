import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/lib/QueryProvider'
import { AuthGuard } from '@/components/ui/AuthGuard'

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
      <body className="min-h-full flex flex-col bg-surface">
        <QueryProvider><AuthGuard>{children}</AuthGuard></QueryProvider>
      </body>
    </html>
  )
}
