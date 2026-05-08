'use client'

import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { Button } from '@/components/ui/Button'
import { ProjectCard } from '@/components/project/ProjectCard'
import { useProjects, useCreateProject } from '@/hooks/useProjects'

export default function HomePage() {
  const router = useRouter()
  const { data, isLoading, isError } = useProjects()
  const createProject = useCreateProject()

  const handleNewProject = async () => {
    const res = await createProject.mutateAsync()
    router.push(`/projects/${res.id}`)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F8F8F8' }}>
      <Header
        rightSlot={
          <Button
            onClick={handleNewProject}
            disabled={createProject.isPending}
          >
            + 새 프로젝트
          </Button>
        }
      />

      <main
        className="flex-1 px-8 py-8"
        style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}
      >
        {isLoading && (
          <div className="flex items-center justify-center" style={{ paddingTop: 80 }}>
            <div style={{ color: '#9E9E9E', fontSize: 14 }}>불러오는 중...</div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center" style={{ paddingTop: 80 }}>
            <div style={{ color: '#EF4444', fontSize: 14 }}>
              프로젝트를 불러오지 못했습니다.
            </div>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div
            className="flex flex-col items-center justify-center"
            style={{ paddingTop: 100, color: '#9E9E9E' }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginBottom: 16, opacity: 0.4 }}
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="#9E9E9E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
              프로젝트가 없습니다
            </div>
            <div style={{ fontSize: 13 }}>새 프로젝트를 만들어 시작하세요.</div>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            {data.items.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
