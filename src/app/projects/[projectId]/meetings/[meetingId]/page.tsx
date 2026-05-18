'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { AgentButton } from '@/components/ui/AgentButton'
import { AgentBar } from '@/components/ui/AgentBar'
import { MeetingSidebar } from '@/components/meeting/MeetingSidebar'
import { MeetingDetail } from '@/components/meeting/MeetingDetail'
import { RecordingPanel } from '@/components/meeting/RecordingPanel'
import { IconEdit, IconCheck } from '@/components/icons'
import { useMeeting, useMeetings, useUpdateMeeting } from '@/hooks/useMeetings'
import { useAgentStore } from '@/store/agentStore'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'

export default function MeetingPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const meetingId = params.meetingId as string

  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId)
  const { data: meetingsData } = useMeetings(projectId)
  const { isOpen: agentOpen, toggle: toggleAgent } = useAgentStore()
  const qc = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [dateDraft, setDateDraft] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [sttStarted, setSttStarted] = useState(false)
  const [processingLabel, setProcessingLabel] = useState('')
  const [liveScripts, setLiveScripts] = useState<{ startTime: number; contents: string }[] | undefined>()
  const [liveSummary, setLiveSummary] = useState<string | undefined>()
  const updateMeeting = useUpdateMeeting(meetingId)

  const handleAnalysisDone = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meetingId) })
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meetings(projectId) })
    setIsProcessing(false)
    setSttStarted(false)
    setProcessingLabel('')
    setLiveScripts(undefined)
    setLiveSummary(undefined)
  }

  const handleEditStart = () => {
    if (!meeting) return
    setTitleDraft(meeting.title)
    setDateDraft((meeting.meetingAt ?? meeting.createdAt).slice(0, 10))
    setIsEditing(true)
  }

  const handleEditSave = async () => {
    if (!meeting) return
    const trimmed = titleDraft.trim()
    const updates: { title?: string; meetingAt?: string } = {}
    if (trimmed && trimmed !== meeting.title) updates.title = trimmed
    if (dateDraft && dateDraft !== (meeting.meetingAt ?? meeting.createdAt).slice(0, 10))
      updates.meetingAt = `${dateDraft}T00:00:00`
    if (Object.keys(updates).length > 0) {
      await updateMeeting.mutateAsync(updates)
    }
    setIsEditing(false)
  }

  if (meetingLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span className="text-md text-text-tertiary">불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span className="text-md text-danger">회의를 찾을 수 없습니다.</span>
        </div>
      </div>
    )
  }

  const meetings = meetingsData?.items ?? []

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 px-8 pt-6 pb-20 overflow-y-auto">
          {/* Back link */}
          <Link href={`/projects/${projectId}`}>
            <span className="text-base text-text-secondary cursor-pointer inline-flex items-center gap-1 mb-4">
              ‹ 프로젝트로 돌아가기
            </span>
          </Link>

          {/* Content depends on status */}
          {isProcessing && !sttStarted ? (
            // 업로드 중 로딩 화면
            <div className="flex flex-col items-center justify-center bg-card border border-card-border rounded-[10px] p-12 min-h-[582px]">
              <div className="w-12 h-12 rounded-full border-[3px] border-border border-t-primary animate-spin mb-5" />
              <div className="text-xl font-semibold text-text-primary mb-2">파일을 처리하고 있습니다</div>
              <div className="text-base text-text-tertiary">{processingLabel || '잠시만 기다려주세요.'}</div>
            </div>
          ) : (meeting.status === 'pending' || meeting.status === 'processing') && !isProcessing ? (
            // Pending - header card + recording panel
            <div className="flex flex-col gap-6">
              {/* Header card */}
              {isEditing ? (
                <div className="bg-card border-2 border-primary rounded-[10px] p-[25px] flex items-center justify-between gap-4">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSave() }}
                    className="flex-1 text-[26px] font-bold text-title border-none outline-none bg-transparent font-[inherit]"
                  />
                  <input
                    type="date"
                    value={dateDraft}
                    onChange={e => setDateDraft(e.target.value)}
                    className="text-lg text-subtitle border-none outline-none bg-transparent cursor-pointer font-[inherit] shrink-0"
                  />
                  <button
                    onClick={handleEditSave}
                    disabled={updateMeeting.isPending}
                    className="bg-transparent border-none cursor-pointer p-0 shrink-0"
                  >
                    <IconCheck width={20} height={20} className="text-primary" />
                  </button>
                </div>
              ) : (
                <div className="bg-card border border-card-border rounded-[10px] p-[25px] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-[30px] font-bold text-title m-0 tracking-[0.4px]">
                      {meeting.title}
                    </h1>
                    <button
                      onClick={handleEditStart}
                      className="bg-transparent border-none cursor-pointer p-0 flex"
                    >
                      <IconEdit width={20} height={20} className="text-text-tertiary" />
                    </button>
                  </div>
                  <span className="text-[16px] text-subtitle tracking-[-0.31px] shrink-0">
                    {(meeting.meetingAt ?? meeting.createdAt).slice(0, 10)}
                  </span>
                </div>
              )}

              <RecordingPanel
                meetingId={meetingId}
                projectId={projectId}
                onAnalysisDone={handleAnalysisDone}
                onProcessingStart={() => {
                  setIsProcessing(true)
                  setSttStarted(false)
                  setLiveScripts([])
                  setLiveSummary('')
                }}
                onProgressUpdate={setProcessingLabel}
                onSttStart={() => setSttStarted(true)}
                onScriptUpdate={setLiveScripts}
                onSummaryUpdate={setLiveSummary}
              />
            </div>
          ) : (
            <MeetingDetail
              meeting={meeting}
              projectId={projectId}
              meetings={meetings}
              liveScripts={liveScripts}
              liveSummary={liveSummary}
            />
          )}
        </main>

        {/* Sidebar */}
        <MeetingSidebar
          projectId={projectId}
          meetings={meetings}
          activeMeetingId={meetingId}
        />
      </div>

      {!agentOpen && <AgentButton onClick={toggleAgent} />}
      <AgentBar projectId={projectId} meetingId={meetingId} />
    </div>
  )
}
