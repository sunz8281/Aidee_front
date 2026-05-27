'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { AgentButton } from '@/components/ui/AgentButton'
import { AgentBar } from '@/components/ui/AgentBar'
import { MeetingSidebar } from '@/components/meeting/MeetingSidebar'
import { MeetingDetail } from '@/components/meeting/MeetingDetail'
import { RecordingPanel } from '@/components/meeting/RecordingPanel'
import { IconEdit, IconCheck, IconTrash } from '@/components/icons'
import { useMeeting, useMeetings, useUpdateMeeting, useDeleteMeeting } from '@/hooks/useMeetings'
import { useAgentStore } from '@/store/agentStore'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { fetchEventSource } from '@microsoft/fetch-event-source'

export default function MeetingPage() {
  const params = useParams()
  const router = useRouter()
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
  const [liveScripts, setLiveScripts] = useState<{ startTime: number; speaker?: string; contents: string }[] | undefined>()
  const [liveSummary, setLiveSummary] = useState<string | undefined>()
  const updateMeeting = useUpdateMeeting(meetingId)
  const deleteMeeting = useDeleteMeeting(projectId)

  // 새로고침 등으로 active SSE 없이 processing 상태인 경우 status/stream SSE 연결
  // stt 이벤트부터는 sttStarted를 true로 바꿔 MeetingDetail 라이브뷰로 전환
  useEffect(() => {
    if (meeting?.status !== 'processing' || isProcessing) return

    const ctrl = new AbortController()
    let sttBuf = ''
    const scripts: { startTime: number; contents: string }[] = []
    let analysisBuf = ''
    let sttHasStarted = false

    function extractSummary(buf: string): string | null {
      const cleaned = buf.replace(/^```json\s*/, '').replace(/```\s*$/, '')
      const idx = cleaned.indexOf('"summary":')
      if (idx === -1) return null
      const after = cleaned.slice(idx + '"summary":'.length).trimStart()
      if (!after.startsWith('"')) return null
      let result = '', i = 1
      while (i < after.length) {
        if (after[i] === '\\' && i + 1 < after.length) {
          const ch = after[i + 1]
          result += ch === '"' ? '"' : ch === 'n' ? '\n' : ch
          i += 2
        } else if (after[i] === '"') break
        else { result += after[i]; i++ }
      }
      return result || null
    }

    fetchEventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/meetings/${meetingId}/status/stream`,
      {
        signal: ctrl.signal,
        credentials: 'include',
        onmessage(ev) {
          try {
            const data = JSON.parse(ev.data) as { message?: string; status?: string; startTime?: number; text?: string }

            if (ev.event === 'stt') {
              if (!sttHasStarted) {
                sttHasStarted = true
                setSttStarted(true)   // 첫 stt 즉시 라이브뷰 전환 (normal upload와 동일)
                setLiveSummary('')    // 요약 박스 미리 표시
                setLiveScripts([])
              }
              if (typeof data.startTime === 'number' && data.text !== undefined) {
                scripts.push({ startTime: data.startTime, contents: data.text })
                setLiveScripts([...scripts])
              }
            } else if (ev.event === 'stt_done') {
              sttBuf = ''
              if (!sttHasStarted) {   // stt 이벤트 없이 stt_done만 오는 엣지케이스
                setSttStarted(true)
                setLiveSummary('')
              }
            } else if (ev.event === 'analyzing') {
              analysisBuf += data.message ?? ''
              const summary = extractSummary(analysisBuf)
              if (summary) setLiveSummary(summary)
            } else if (ev.event === 'done' || data.status === 'done') {
              handleAnalysisDone()
              ctrl.abort()
            } else if (ev.event === 'failed' || data.status === 'failed') {
              qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meetingId) })
              qc.invalidateQueries({ queryKey: QUERY_KEYS.meetings(projectId) })
              ctrl.abort()
            }
          } catch {}
        },
        onerror() {
          ctrl.abort()
          throw new Error('status stream closed')
        },
      },
    ).catch(() => {})

    return () => ctrl.abort()
  }, [meeting?.status, isProcessing, meetingId, projectId, qc])

  const handleDeleteMeeting = async () => {
    if (!confirm('회의를 삭제하시겠습니까?')) return
    await deleteMeeting.mutateAsync(meetingId)
    const meetings = meetingsData?.items ?? []
    const idx = meetings.findIndex(m => m.id === meetingId)
    const next = meetings[idx + 1] ?? meetings[idx - 1]
    router.push(next ? `/projects/${projectId}/meetings/${next.id}` : `/projects/${projectId}`)
  }

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
          {/* Back link + delete */}
          <div className="flex items-center justify-between mb-4">
            <Link href={`/projects/${projectId}`}>
              <span className="text-base text-text-secondary cursor-pointer inline-flex items-center gap-1">
                ‹ 프로젝트로 돌아가기
              </span>
            </Link>
            <button
              onClick={handleDeleteMeeting}
              disabled={deleteMeeting.isPending}
              className="flex items-center gap-1.5 text-sm text-danger bg-transparent border-none cursor-pointer p-0 disabled:opacity-40"
            >
              <IconTrash width={14} height={14} />
              회의 삭제
            </button>
          </div>

          {/* Content depends on status */}
          {isProcessing && !sttStarted ? (
            // 클라이언트 업로드 중 로딩 화면
            <div className="flex flex-col items-center justify-center bg-card border border-card-border rounded-[10px] p-12 min-h-[582px]">
              <div className="w-12 h-12 rounded-full border-[3px] border-border border-t-primary animate-spin mb-5" />
              <div className="text-xl font-semibold text-text-primary mb-2">파일을 처리하고 있습니다</div>
              <div className="text-base text-text-tertiary">{processingLabel || '잠시만 기다려주세요.'}</div>
            </div>
          ) : !isProcessing && meeting.status === 'processing' && !sttStarted ? (
            // 새로고침 후 스크립트 도착 전 - 스피너
            <div className="flex flex-col items-center justify-center bg-card border border-card-border rounded-[10px] p-12 min-h-[582px]">
              <div className="w-12 h-12 rounded-full border-[3px] border-border border-t-primary animate-spin mb-5" />
              <div className="text-xl font-semibold text-text-primary mb-2">회의를 분석하고 있습니다</div>
              <div className="text-base text-text-tertiary">잠시 후 자동으로 업데이트됩니다.</div>
            </div>
          ) : !isProcessing && (meeting.status === 'pending' || meeting.status === 'failed') ? (
            // 대기 중 / 실패 - 헤더 + RecordingPanel
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
                failed={meeting.status === 'failed'}
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
