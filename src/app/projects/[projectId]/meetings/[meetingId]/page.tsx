'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { AgentButton } from '@/components/ui/AgentButton'
import { AgentBar } from '@/components/ui/AgentBar'
import { MeetingSidebar } from '@/components/meeting/MeetingSidebar'
import { MeetingDetail } from '@/components/meeting/MeetingDetail'
import { RecordingPanel } from '@/components/meeting/RecordingPanel'
import { useMeeting } from '@/hooks/useMeetings'
import { useProject } from '@/hooks/useProjects'
import { useAgentStore } from '@/store/agentStore'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'

export default function MeetingPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const meetingId = params.meetingId as string

  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId)
  const { data: project } = useProject(projectId)
  const { toggle: toggleAgent } = useAgentStore()
  const qc = useQueryClient()

  const handleAnalysisDone = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meetingId) })
    qc.invalidateQueries({ queryKey: QUERY_KEYS.meetings(projectId) })
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

  const meetings = project?.meetings ?? []

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
                  border: '1px solid #E5E5E5',
                  borderRadius: 12,
                  padding: 48,
                  minHeight: 300,
                  marginTop: 8,
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
              // Pending - recording panel
              <>
                {/* Meeting title header */}
                <div style={{ marginBottom: 16 }}>
                  <div className="flex items-center justify-between">
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                      {meeting.title}
                    </h1>
                    <span style={{ fontSize: 13, color: '#9E9E9E' }}>
                      {(meeting.meetingAt ?? meeting.createdAt).slice(0, 10)}
                    </span>
                  </div>
                </div>
                <RecordingPanel
                  meetingId={meetingId}
                  projectId={projectId}
                  onAnalysisDone={handleAnalysisDone}
                />
              </>
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
