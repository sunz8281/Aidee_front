'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IconCheck, IconEdit, IconTrash, IconMemo } from '@/components/icons'
import { Header } from '@/components/ui/Header'
import { AgentButton } from '@/components/ui/AgentButton'
import { AgentBar } from '@/components/ui/AgentBar'
import { MeetingList } from '@/components/project/MeetingList'
import { ProjectCalendar } from '@/components/project/ProjectCalendar'
import { MemoSection } from '@/components/project/MemoSection'
import { useProject, useUpdateProjectTitle, useDeleteProject, useEnableShare, useDisableShare } from '@/hooks/useProjects'
import { useCreateMeeting } from '@/hooks/useMeetings'
import { useSchedules } from '@/hooks/useSchedules'
import { useMemos } from '@/hooks/useMemos'
import { useAgentStore } from '@/store/agentStore'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()

  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const { data: project, isLoading } = useProject(projectId)
  const calFrom = (() => {
    const firstDayOfMonth = new Date(calYear, calMonth - 1, 1)
    const startOffset = firstDayOfMonth.getDay() // 0=Sun
    const from = new Date(calYear, calMonth - 1, 1 - startOffset)
    return `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`
  })()
  const calTo = (() => {
    const firstDayOfMonth = new Date(calYear, calMonth - 1, 1)
    const startOffset = firstDayOfMonth.getDay()
    const to = new Date(calYear, calMonth - 1, 1 - startOffset + 41)
    return `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`
  })()
  const { data: schedulesData } = useSchedules(projectId, calFrom, calTo)
  const { data: memosData } = useMemos(projectId)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const updateTitle = useUpdateProjectTitle(projectId)
  const deleteProject = useDeleteProject()
  const enableShare = useEnableShare(projectId)
  const disableShare = useDisableShare(projectId)
  const createMeeting = useCreateMeeting(projectId)
  const { isOpen: agentOpen, toggle: toggleAgent } = useAgentStore()

  // 프로젝트 로드 시 shareToken 초기화
  useEffect(() => {
    if (project?.shareToken !== undefined) {
      setShareToken(project.shareToken)
    }
  }, [project?.shareToken])

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null

  const handleEnableShare = async () => {
    const data = await enableShare.mutateAsync()
    setShareToken(data.shareToken)
  }

  const handleDisableShare = async () => {
    await disableShare.mutateAsync()
    setShareToken(null)
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTitleEdit = () => {
    setTitleDraft(project?.name ?? '')
    setIsEditingTitle(true)
  }

  const handleTitleSave = async () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== project?.name) {
      await updateTitle.mutateAsync(trimmed)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') setIsEditingTitle(false)
  }

  const handleDeleteProject = async () => {
    if (!confirm('프로젝트를 삭제하시겠습니까?')) return
    await deleteProject.mutateAsync(projectId)
    router.push('/')
  }

  const handleAddMeeting = async () => {
    const res = await createMeeting.mutateAsync({})
    router.push(`/projects/${projectId}/meetings/${res.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span className="text-md text-text-tertiary">불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span className="text-md text-danger">프로젝트를 찾을 수 없습니다.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="max-w-[1280px] mx-auto w-full px-8 pt-8 pb-20">
        {/* Title */}
        <div className="mb-6">
          {isEditingTitle ? (
            <div className="flex items-center border-2 border-primary rounded-lg bg-card px-4 h-16">
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="flex-1 text-[26px] font-bold text-text-primary border-none outline-none bg-transparent"
              />
              <button
                onClick={handleTitleSave}
                className="bg-transparent border-none cursor-pointer text-primary flex items-center p-1 shrink-0"
              >
                <IconCheck width={22} height={22} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] font-bold text-text-primary m-0">{project.name}</h1>
              <button
                onClick={handleTitleEdit}
                className="bg-transparent border-none cursor-pointer text-text-tertiary p-1 rounded-sm flex items-center"
                title="프로젝트 이름 수정"
              >
                <IconEdit width={16} height={16} className="opacity-50" />
              </button>

              <div className="ml-auto flex items-center gap-2">
                {/* 공유 중일 때: URL 복사 + 공유 해제 */}
                {shareToken ? (
                  <>
                    <button
                      onClick={handleCopyLink}
                      className="text-sm text-primary border border-primary rounded-md px-3 py-1 bg-transparent cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      {copied ? '복사됨 ✓' : '링크 복사'}
                    </button>
                    <button
                      onClick={handleDisableShare}
                      disabled={disableShare.isPending}
                      className="text-sm text-text-tertiary border border-border rounded-md px-3 py-1 bg-transparent cursor-pointer hover:bg-surface transition-colors disabled:opacity-40"
                    >
                      공유 해제
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEnableShare}
                    disabled={enableShare.isPending}
                    className="text-sm text-text-secondary border border-border rounded-md px-3 py-1 bg-transparent cursor-pointer hover:bg-surface transition-colors disabled:opacity-40"
                  >
                    {enableShare.isPending ? '공유 중...' : '공유'}
                  </button>
                )}
                <button
                  onClick={handleDeleteProject}
                  className="bg-transparent border-none cursor-pointer text-text-tertiary p-1 rounded-sm flex items-center"
                  title="프로젝트 삭제"
                >
                  <IconTrash width={16} height={16} className="opacity-50" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Meeting list + Calendar */}
        <div className="flex gap-4 items-stretch">
          <div className="w-[300px] shrink-0 flex">
            <MeetingList
              projectId={projectId}
              meetings={project.meetings ?? []}
              onAdd={handleAddMeeting}
              isCreating={createMeeting.isPending}
            />
          </div>
          <ProjectCalendar
            projectId={projectId}
            schedules={schedulesData?.items ?? []}
            meetings={project.meetings ?? []}
            year={calYear}
            month={calMonth}
            onMonthChange={(y, m) => {
              setCalYear(y)
              setCalMonth(m)
            }}
          />
        </div>

        {/* Memo section */}
        <div className="bg-card border border-border rounded-lg px-5 py-4 mt-6">
          <div className={['flex items-center gap-2', memosData?.items.length ? 'mb-4' : ''].join(' ')}>
            <IconMemo width={16} height={16} />
            <span className="text-md font-semibold text-text-primary">메모</span>
          </div>
          {memosData && memosData.items.length > 0 ? (
            <MemoSection memos={memosData.items} meetings={project.meetings ?? []} />
          ) : (
            <div className="text-base text-text-tertiary py-2">회의 메모가 없습니다.</div>
          )}
        </div>
      </main>

      {!agentOpen && <AgentButton onClick={toggleAgent} />}
      <AgentBar projectId={projectId} />
    </div>
  )
}
