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
  const { toggle: toggleAgent } = useAgentStore()
  const qc = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [dateDraft, setDateDraft] = useState('')
  const updateMeeting = useUpdateMeeting(meetingId)

  const handleAnalysisDone = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meetingId) })
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meetings(projectId) })
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
      <div className="flex flex-col min-h-screen" style={{ background: '#F8F8F8' }}>
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span style={{ color: '#9E9E9E', fontSize: 14 }}>불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#F8F8F8' }}>
        <Header />
        <div className="flex items-center justify-center flex-1">
          <span style={{ color: '#EF4444', fontSize: 14 }}>회의를 찾을 수 없습니다.</span>
        </div>
      </div>
    )
  }

  const meetings = meetingsData?.items ?? []

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F8F8F8' }}>
      <Header />

      <div className="flex flex-1" style={{ overflow: 'hidden' }}>
        {/* Main content */}
        <main
          style={{
            flex: 1,
            padding: '24px 32px 80px',
            overflowY: 'auto',
          }}
        >
          {/* Back link */}
          <Link href={`/projects/${projectId}`}>
            <span
              style={{
                fontSize: 13,
                color: '#6B6B6B',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 16,
              }}
            >
              ‹ 프로젝트로 돌아가기
            </span>
          </Link>

          {/* Content depends on status */}
          {meeting.status === 'pending' || meeting.status === 'processing' ? (
            meeting.status === 'processing' ? (
              // Processing - spinner
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: 48,
                  minHeight: 582,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '3px solid #E5E5E5',
                    borderTopColor: '#3B5BDB',
                    animation: 'spin 0.8s linear infinite',
                    marginBottom: 20,
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', marginBottom: 8 }}>
                  파일을 처리하고 있습니다
                </div>
                <div style={{ fontSize: 13, color: '#9E9E9E' }}>
                  잠시만 기다려주세요. 곧 회의 기록이 생성됩니다.
                </div>
              </div>
            ) : (
              // Pending - header card + recording panel
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Header card — same style as done/failed */}
                {isEditing ? (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '2px solid #004fff',
                      borderRadius: 10,
                      padding: 25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditSave() }}
                      style={{
                        flex: 1,
                        fontSize: 26,
                        fontWeight: 700,
                        color: '#0a0a0a',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                      }}
                    />
                    <input
                      type="date"
                      value={dateDraft}
                      onChange={e => setDateDraft(e.target.value)}
                      style={{
                        fontSize: 15,
                        color: '#4a5565',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        flexShrink: 0,
                      }}
                    />
                    <button
                      onClick={handleEditSave}
                      disabled={updateMeeting.isPending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      <IconCheck width={20} height={20} className="text-primary" />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <h1 style={{ fontSize: 30, fontWeight: 700, color: '#0a0a0a', margin: 0, letterSpacing: '0.4px' }}>
                        {meeting.title}
                      </h1>
                      <button
                        onClick={handleEditStart}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <IconEdit width={20} height={20} style={{ color: '#9e9e9e' }} />
                      </button>
                    </div>
                    <span style={{ fontSize: 16, color: '#4a5565', letterSpacing: '-0.31px', flexShrink: 0 }}>
                      {(meeting.meetingAt ?? meeting.createdAt).slice(0, 10)}
                    </span>
                  </div>
                )}

                <RecordingPanel
                  meetingId={meetingId}
                  projectId={projectId}
                  onAnalysisDone={handleAnalysisDone}
                />
              </div>
            )
          ) : (
            // Done or failed
            <MeetingDetail meeting={meeting} projectId={projectId} />
          )}
        </main>

        {/* Sidebar */}
        <MeetingSidebar
          projectId={projectId}
          meetings={meetings}
          activeMeetingId={meetingId}
        />
      </div>

      <AgentButton onClick={toggleAgent} />
      <AgentBar projectId={projectId} meetingId={meetingId} />
    </div>
  )
}
