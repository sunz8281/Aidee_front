'use client'

import { useState, useRef, useEffect } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { IconMic } from '@/components/icons'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Button } from '@/components/ui/Button'

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

interface RecordingPanelProps {
  meetingId: string
  projectId: string
  onAnalysisDone: () => void
}

const panelBase = 'flex flex-col items-center justify-center bg-card border border-card-border rounded-[10px] p-12 min-h-[582px]'

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
      <div className={panelBase}>
        <div className="w-12 h-12 rounded-full border-[3px] border-border border-t-primary animate-spin mb-5" />
        <div className="text-xl font-semibold text-text-primary mb-2">파일을 처리하고 있습니다</div>
        <div className="text-base text-text-tertiary">
          {progressLabel || '잠시만 기다려주세요. 곧 회의 기록이 생성됩니다.'}
        </div>
      </div>
    )
  }

  // Recording state
  if (state === 'recording') {
    return (
      <div className={panelBase}>
        <div className="w-[72px] h-[72px] rounded-full bg-recording flex items-center justify-center mb-5">
          <IconMic width={32} height={32} className="text-recording-icon" />
        </div>
        <div className="text-xl font-semibold text-text-primary mb-1.5">녹음 중입니다</div>
        <div className="text-base text-text-tertiary mb-5">페이지를 나가면 녹음이 중지됩니다.</div>
        <div className="text-[28px] font-bold text-recording-icon tabular-nums mb-5">
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
      <div className={panelBase}>
        <div className="w-[72px] h-[72px] rounded-full bg-border-light flex items-center justify-center mb-5">
          <IconMic width={32} height={32} />
        </div>
        <div className="text-xl font-semibold text-text-primary mb-1.5">녹음이 중지되었습니다.</div>
        <div className="text-base text-text-tertiary mb-5">녹음을 끝내시겠습니까?</div>
        <div className="text-[28px] font-bold text-recording-icon tabular-nums mb-6">
          {formatTime(elapsed)}
        </div>
        <div className="flex gap-3 mb-3">
          <Button variant="outline" onClick={handleResume} size="md" className="text-primary border-primary">
            계속 녹음하기
          </Button>
          <Button variant="primary" onClick={handleFinish} size="md">
            녹음 끝내기
          </Button>
        </div>
        <button
          onClick={handleDiscard}
          className="bg-transparent border-none cursor-pointer text-base text-text-tertiary"
        >
          녹음 삭제하기
        </button>
      </div>
    )
  }

  // Idle state
  return (
    <div className={panelBase}>
      <div className="w-32 h-32 rounded-full bg-[#c7c7c7] flex items-center justify-center mb-7">
        <IconMic width={64} height={64} className="text-white" />
      </div>
      <div className="text-[24px] font-semibold text-title mb-3">녹음 시작하기</div>
      <div className="text-[16px] text-subtitle tracking-[-0.31px] mb-7">
        녹음을 시작하거나 녹음 파일을 업로드합니다.
      </div>
      <div className="flex flex-col gap-3 items-center">
        <label className="inline-flex items-center gap-[7px] px-6 py-3 rounded-[10px] border-2 border-primary cursor-pointer text-[16px] text-primary tracking-[-0.31px]">
          ↑ 녹음 파일 업로드
          <input
            type="file"
            accept=".mp3,.m4a,.wav,.webm"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <button
          onClick={handleStartRecording}
          className="inline-flex items-center justify-center gap-[7px] px-6 py-3 w-[184px] rounded-[10px] border-none cursor-pointer text-[16px] text-white bg-primary tracking-[-0.31px]"
        >
          ⏺ 녹음 시작
        </button>
      </div>
    </div>
  )
}
