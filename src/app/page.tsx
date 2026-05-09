'use client'

import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { IconChat } from '@/components/icons'
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
    <div className="flex flex-col min-h-screen bg-surface">
      <Header
        rightSlot={
          <Button onClick={handleNewProject} disabled={createProject.isPending}>
            + 새 프로젝트
          </Button>
        }
      />

      <main className="flex-1 px-8 py-8 max-w-[1280px] mx-auto w-full">
        {isLoading && (
          <div className="flex items-center justify-center pt-20">
            <div className="text-md text-text-tertiary">불러오는 중...</div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center pt-20">
            <div className="text-md text-danger">프로젝트를 불러오지 못했습니다.</div>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-[100px] text-text-tertiary">
            <IconChat width={48} height={48} className="mb-4 opacity-40 text-text-tertiary" />
            <div className="text-lg font-medium mb-2">프로젝트가 없습니다</div>
            <div className="text-base">새 프로젝트를 만들어 시작하세요.</div>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {data.items.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
