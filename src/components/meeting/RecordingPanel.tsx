'use client'

import { useState, useRef, useEffect } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Button } from '@/components/ui/Button'

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

interface RecordingPanelProps {
  meetingId: string
  projectId: string
  onAnalysisDone: () => void
}

export function RecordingPanel({ meetingId, projectId, onAnalysisDone }: RecordingPanelProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const qc = useQueryClient()

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    return () => {
      stopTimer()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const formatTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.start(1000)
      setState('recording')
      setElapsed(0)
      startTimer()
    } catch {
      alert('마이크 접근 권한이 필요합니다.')
    }
  }

  const handlePause = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
    }
    stopTimer()
    setState('paused')
  }

  const handleResume = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
    startTimer()
    setState('recording')
  }

  const handleFinish = async () => {
    stopTimer()
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }

    // wait for data
    await new Promise<void>(resolve => setTimeout(resolve, 300))

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    await uploadAndAnalyze(blob)
  }

  const handleDiscard = () => {
    stopTimer()
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setState('idle')
    setElapsed(0)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadAndAnalyze(file)
  }

  const uploadAndAnalyze = async (audioBlob: Blob | File) => {
    setState('processing')
    setProgressLabel('파일을 처리하고 있습니다')

    const formData = new FormData()
    formData.append('audioFile', audioBlob, 'recording.webm')

    try {
      await fetchEventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/meetings/${meetingId}/audio`,
        {
          method: 'POST',
          body: formData,
          onmessage(ev) {
            if (ev.event === 'stt_progress') {
              const { progress } = JSON.parse(ev.data) as { progress: number }
              setProgressLabel(`음성 변환 중... ${progress}%`)
            } else if (ev.event === 'stt_done') {
              setProgressLabel('AI 분석 중...')
            } else if (ev.event === 'ai_progress') {
              const { step } = JSON.parse(ev.data) as { step: string }
              setProgressLabel(step)
            } else if (ev.event === 'done') {
              qc.invalidateQueries({ queryKey: QUERY_KEYS.meeting(meetingId) })
              qc.invalidateQueries({ queryKey: QUERY_KEYS.meetings(projectId) })
              onAnalysisDone()
            }
          },
          onerror(err) {
            setState('idle')
            throw err
          },
        },
      )
    } catch {
      setState('idle')
      setProgressLabel('')
    }
  }

  // Processing state
  if (state === 'processing') {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          background: '#ffffff',
          border: '1px solid #E5E5E5',
          borderRadius: 12,
          padding: 48,
          minHeight: 300,
        }}
      >
        {/* Spinner */}
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
          {progressLabel || '잠시만 기다려주세요. 곧 회의 기록이 생성됩니다.'}
        </div>
      </div>
    )
  }

  // Recording state
  if (state === 'recording') {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          background: '#ffffff',
          border: '1px solid #E5E5E5',
          borderRadius: 12,
          padding: 48,
          minHeight: 300,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#EF4444">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', marginBottom: 6 }}>
          녹음 중입니다
        </div>
        <div style={{ fontSize: 13, color: '#9E9E9E', marginBottom: 20 }}>
          페이지를 나가면 녹음이 중지됩니다.
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#EF4444',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 20,
          }}
        >
          {formatTime(elapsed)}
        </div>
        <Button variant="danger" onClick={handlePause} size="md">
          ⏸ 일시 정지
        </Button>
      </div>
    )
  }

  // Paused state
  if (state === 'paused') {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          background: '#ffffff',
          border: '1px solid #E5E5E5',
          borderRadius: 12,
          padding: 48,
          minHeight: 300,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#9E9E9E">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#9E9E9E" strokeWidth="2" fill="none" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', marginBottom: 6 }}>
          녹음이 중지되었습니다.
        </div>
        <div style={{ fontSize: 13, color: '#9E9E9E', marginBottom: 20 }}>
          녹음을 끝내시겠습니까?
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#EF4444',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 24,
          }}
        >
          {formatTime(elapsed)}
        </div>
        <div className="flex gap-3" style={{ marginBottom: 12 }}>
          <Button variant="outline" onClick={handleResume} size="md" style={{ color: '#3B5BDB', borderColor: '#3B5BDB' }}>
            계속 녹음하기
          </Button>
          <Button variant="primary" onClick={handleFinish} size="md">
            녹음 끝내기
          </Button>
        </div>
        <button
          onClick={handleDiscard}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9E9E9E' }}
        >
          녹음 삭제하기
        </button>
      </div>
    )
  }

  // Idle state
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        background: '#ffffff',
        border: '1px solid #E5E5E5',
        borderRadius: 12,
        padding: 48,
        minHeight: 300,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#9E9E9E">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#9E9E9E" strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="23" x2="16" y2="23" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', marginBottom: 6 }}>
        녹음 시작하기
      </div>
      <div style={{ fontSize: 13, color: '#9E9E9E', marginBottom: 28 }}>
        녹음을 시작하거나 녹음 파일을 업로드합니다.
      </div>
      <div className="flex flex-col gap-3" style={{ alignItems: 'center' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 20px',
            height: 40,
            borderRadius: 8,
            border: '1px solid #E5E5E5',
            cursor: 'pointer',
            fontSize: 14,
            color: '#1A1A1A',
            background: '#ffffff',
          }}
        >
          ↑ 녹음 파일 업로드
          <input
            type="file"
            accept=".mp3,.m4a,.wav,.webm"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        <Button variant="primary" onClick={handleStartRecording} size="md">
          ⏺ 녹음 시작
        </Button>
      </div>
    </div>
  )
}
