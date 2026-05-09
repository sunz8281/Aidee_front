'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IconCheck, IconEdit, IconTrash, IconMemo } from '@/components/icons'
import { Header } from '@/components/ui/Header'
import { AgentButton } from '@/components/ui/AgentButton'
import { AgentBar } from '@/components/ui/AgentBar'
import { MeetingList } from '@/components/project/MeetingList'
import { ProjectCalendar } from '@/components/project/ProjectCalendar'
import { MemoSection } from '@/components/project/MemoSection'
import { useProject, useUpdateProjectTitle, useDeleteProject } from '@/hooks/useProjects'
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
  const { data: schedulesData } = useSchedules(projectId, calYear, calMonth)
  const { data: memosData } = useMemos(projectId)
  const updateTitle = useUpdateProjectTitle(projectId)
  const deleteProject = useDeleteProject()
  const createMeeting = useCreateMeeting(projectId)
  const { toggle: toggleAgent } = useAgentStore()

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
      <div className="flex flex-col min-h-screen" style={{ background: '#F8F8F8' }}>
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span style={{ color: '#9E9E9E', fontSize: 14 }}>불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#F8F8F8' }}>
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span style={{ color: '#EF4444', fontSize: 14 }}>프로젝트를 찾을 수 없습니다.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F8F8F8' }}>
      <Header />

      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          padding: '32px 32px 80px',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          {isEditingTitle ? (
            <div
              className="flex items-center"
              style={{
                border: '2px solid #3B5BDB',
                borderRadius: 12,
                background: '#ffffff',
                padding: '0 16px',
                height: 64,
              }}
            >
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                style={{
                  flex: 1,
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#1A1A1A',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                }}
              />
              <button
                onClick={handleTitleSave}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#3B5BDB',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  flexShrink: 0,
                }}
              >
                <IconCheck width={22} height={22} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                {project.name}
              </h1>
              <button
                onClick={handleTitleEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9E9E9E',
                  padding: 4,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="프로젝트 이름 수정"
              >
                <IconEdit width={16} height={16} style={{ opacity: 0.5 }} />
              </button>
              <button
                onClick={handleDeleteProject}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9E9E9E',
                  padding: 4,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 'auto',
                }}
                title="프로젝트 삭제"
              >
                <IconTrash width={16} height={16} style={{ opacity: 0.5 }} />
              </button>
            </div>
          )}
        </div>

        {/* Meeting list + Calendar */}
        <div className="flex gap-4" style={{ alignItems: 'stretch' }}>
          <div style={{ width: 300, flexShrink: 0, display: 'flex' }}>
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
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #E5E5E5',
            borderRadius: 12,
            padding: '16px 20px',
            marginTop: 24,
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: memosData?.items.length ? 16 : 0 }}>
            <IconMemo width={16} height={16} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>메모</span>
          </div>
          {memosData && memosData.items.length > 0 ? (
            <MemoSection memos={memosData.items} meetings={project.meetings ?? []} />
          ) : (
            <div style={{ color: '#9E9E9E', fontSize: 13, padding: '8px 0' }}>
              회의 메모가 없습니다.
            </div>
          )}
        </div>
      </main>

      <AgentButton onClick={toggleAgent} />
      <AgentBar projectId={projectId} />
    </div>
  )
}
