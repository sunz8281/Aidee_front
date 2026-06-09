'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { IconMic } from '@/components/icons'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Button } from '@/components/ui/Button'

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

interface RecordingPanelProps {
  meetingId: string
  projectId: string
  failed?: boolean
  onAnalysisDone: () => void
  onProcessingStart?: () => void
  onProgressUpdate?: (msg: string) => void
  onSttStart?: () => void
  onScriptUpdate?: (scripts: { startTime: number; speaker?: string; contents: string }[]) => void
  onSummaryUpdate?: (summary: string) => void
}

function extractStreamingSummary(buffer: string): string | null {
  const cleaned = buffer.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  const idx = cleaned.indexOf('"summary":')
  if (idx === -1) return null
  const afterKey = cleaned.slice(idx + '"summary":'.length).trimStart()
  if (!afterKey.startsWith('"')) return null
  const valueStr = afterKey.slice(1)
  let result = ''
  let i = 0
  while (i < valueStr.length) {
    if (valueStr[i] === '\\' && i + 1 < valueStr.length) {
      const ch = valueStr[i + 1]
      if (ch === '"') result += '"'
      else if (ch === 'n') result += '\n'
      else result += ch
      i += 2
    } else if (valueStr[i] === '"') {
      break
    } else {
      result += valueStr[i]
      i++
    }
  }
  return result || null
}

type Segment = { startTime: number; text: string }

function formatSeconds(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export function RecordingPanel({ meetingId, projectId, failed, onAnalysisDone, onProcessingStart, onProgressUpdate, onSttStart, onScriptUpdate, onSummaryUpdate }: RecordingPanelProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [committedSegments, setCommittedSegments] = useState<Segment[]>([])
  const [liveSegment, setLiveSegment] = useState<Segment | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const liveScriptsRef = useRef<{ startTime: number; speaker?: string; contents: string }[]>([])
  const analysisBufferRef = useRef('')
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const elapsedRef = useRef(0)
  const scriptScrollRef = useRef<HTMLDivElement>(null)
  const currentStartTimeRef = useRef<number | null>(null)
  const liveTextRef = useRef('')
  const wsStartOffsetRef = useRef(0)  // WebSocket 연결 시점의 누적 경과 시간

  const qc = useQueryClient()

  useEffect(() => {
    scriptScrollRef.current?.scrollTo({ top: scriptScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [committedSegments])

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed(e => {
      const next = e + 1
      elapsedRef.current = next
      return next
    }), 1000)
  }
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const stopWebSocket = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.onmessage = null
      wsRef.current.onerror = null
      if (wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const startWebSocket = useCallback(() => {
    if (!streamRef.current) return

    // 이 WebSocket 세션의 startTime=0이 실제 녹음 몇 초에 해당하는지 기록
    wsStartOffsetRef.current = elapsedRef.current

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsUrl}/meetings/${meetingId}/stt/stream`)
    wsRef.current = ws

    try {
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(streamRef.current)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      source.connect(processor)
      processor.connect(audioCtx.destination)

      ws.onopen = () => {
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return
          const float32 = e.inputBuffer.getChannelData(0)
          const int16 = new Int16Array(float32.length)
          for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]))
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }
          ws.send(int16.buffer)
        }
      }
    } catch {}

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as {
          type?: 'partial' | 'final'
          text?: string
          startTime?: number
          error?: string
        }
        if (data.error || !data.text) return

        const startTime = (data.startTime ?? elapsedRef.current) + wsStartOffsetRef.current
        const trimmed = data.text.trim()

        if (data.type === 'final') {
          // 현재 live 세그먼트 + final을 모두 committed로 확정
          const liveText = liveTextRef.current.trim()
          const liveStart = currentStartTimeRef.current
          setCommittedSegments(prev => {
            const next = [...prev]
            if (liveText && liveStart !== null) next.push({ startTime: liveStart, text: liveText })
            next.push({ startTime, text: trimmed })
            return next
          })
          liveTextRef.current = ''
          setLiveSegment(null)
          currentStartTimeRef.current = null
        } else {
          if (currentStartTimeRef.current !== null && currentStartTimeRef.current !== startTime) {
            // startTime 바뀜 → 이전 live 세그먼트를 committed로 확정
            const prevText = liveTextRef.current.trim()
            const prevStart = currentStartTimeRef.current
            if (prevText) {
              setCommittedSegments(prev => [...prev, { startTime: prevStart, text: prevText }])
            }
            liveTextRef.current = trimmed
          } else {
            // 같은 startTime → 단어 누적 (덮어쓰기 금지)
            liveTextRef.current = liveTextRef.current
              ? liveTextRef.current + ' ' + trimmed
              : trimmed
          }
          currentStartTimeRef.current = startTime
          setLiveSegment({ startTime, text: liveTextRef.current })
        }
      } catch {}
    }
    ws.onerror = () => {}
  }, [meetingId])

  useEffect(() => {
    return () => {
      stopTimer()
      stopWebSocket()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [stopWebSocket])

  const formatTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(1000)

      setState('recording')
      setElapsed(0)
      elapsedRef.current = 0
      wsStartOffsetRef.current = 0
      setCommittedSegments([])
      setLiveSegment(null)
      currentStartTimeRef.current = null
      liveTextRef.current = ''
      startTimer()
      startWebSocket()
    } catch {
      alert('마이크 접근 권한이 필요합니다.')
    }
  }

  const handlePause = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
    }
    stopTimer()
    stopWebSocket()
    // 일시정지 시 현재 live 세그먼트를 committed로 확정
    const live = liveTextRef.current.trim()
    const liveStart = currentStartTimeRef.current
    if (live && liveStart !== null) {
      setCommittedSegments(prev => [...prev, { startTime: liveStart, text: live }])
    }
    liveTextRef.current = ''
    setLiveSegment(null)
    currentStartTimeRef.current = null
    setState('paused')
  }

  const handleResume = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
    startTimer()
    startWebSocket()
    setState('recording')
  }

  const handleFinish = async () => {
    stopTimer()
    stopWebSocket()
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
    await new Promise<void>(resolve => setTimeout(resolve, 300))
    const mimeType = mediaRecorderRef.current?.mimeType ?? 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    await uploadAndAnalyze(blob)
  }

  const handleDiscard = () => {
    stopTimer()
    stopWebSocket()
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setState('idle')
    setElapsed(0)
    setCommittedSegments([])
    setLiveSegment(null)
    currentStartTimeRef.current = null
    liveTextRef.current = ''
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadAndAnalyze(file)
  }

  const uploadAndAnalyze = async (audioBlob: Blob | File) => {
    setState('processing')
    onProcessingStart?.()
    setProgressLabel('녹음 파일을 업로드하는 중입니다')
    liveScriptsRef.current = []
    analysisBufferRef.current = ''

    const formData = new FormData()
    formData.append('audioFile', audioBlob, 'recording.webm')

    try {
      await fetchEventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/meetings/${meetingId}/audio`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
          onmessage(ev) {
            const data = JSON.parse(ev.data) as { message?: string; startTime?: number; speaker?: string; text?: string; progress?: number; step?: string }

            if (ev.event === 'upload' || ev.event === 'stt_progress') {
              setProgressLabel(data.message ?? (data.progress !== undefined ? `STT 변환 중... ${data.progress}%` : ''))
              onProgressUpdate?.(data.message ?? '')
            } else if (ev.event === 'stt') {
              onSttStart?.()
              if (typeof data.startTime === 'number' && data.text !== undefined) {
                liveScriptsRef.current.push({ startTime: data.startTime, speaker: data.speaker, contents: data.text })
                onScriptUpdate?.([...liveScriptsRef.current])
              }
            } else if (ev.event === 'stt_done') {
              setProgressLabel(data.message ?? '')
            } else if (ev.event === 'ai_progress' || ev.event === 'analyzing') {
              const label = data.step ?? data.message ?? ''
              setProgressLabel(label)
              onProgressUpdate?.(label)
              if (ev.event === 'analyzing') {
                analysisBufferRef.current += data.message ?? ''
                const summary = extractStreamingSummary(analysisBufferRef.current)
                if (summary) onSummaryUpdate?.(summary)
              }
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
      <div className="flex flex-col items-center justify-center bg-card border border-card-border rounded-[10px] p-12 min-h-[582px]">
        <div className="w-12 h-12 rounded-full border-[3px] border-border border-t-primary animate-spin mb-5" />
        <div className="text-xl font-semibold text-text-primary mb-2">파일을 처리하고 있습니다</div>
        <div className="text-base text-text-tertiary">
          {progressLabel || '잠시만 기다려주세요. 곧 회의 기록이 생성됩니다.'}
        </div>
      </div>
    )
  }

  // Recording / Paused state
  if (state === 'recording' || state === 'paused') {
    const isRecording = state === 'recording'
    const hasSegments = committedSegments.length > 0 || liveSegment !== null

    return (
      <>
        {/* Transcript card */}
        <div className="bg-card border border-card-border rounded-[10px] p-[25px] min-h-[200px]">
          {hasSegments ? (
            <div ref={scriptScrollRef} className="overflow-y-auto max-h-[500px]">
              <div className="flex flex-col gap-4">
                {committedSegments.map((seg, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-md text-text-tertiary min-w-[48px] shrink-0 tabular-nums">
                      {formatSeconds(seg.startTime)}
                    </span>
                    <p className="text-[16px] text-body m-0 leading-6 tracking-[-0.31px]">
                      {seg.text}
                    </p>
                  </div>
                ))}
                {liveSegment && (
                  <div className="flex gap-4 items-start">
                    <span className="text-md text-text-tertiary min-w-[48px] shrink-0 tabular-nums">
                      {formatSeconds(liveSegment.startTime)}
                    </span>
                    <p className="text-[16px] text-text-tertiary m-0 leading-6 tracking-[-0.31px]">
                      {liveSegment.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2">
              <div className="w-2 h-2 rounded-full bg-recording-icon animate-pulse shrink-0" />
              <span className="text-base text-text-tertiary">음성을 인식하고 있습니다...</span>
            </div>
          )}
        </div>

        {/* Fixed recording bar */}
        <div className="fixed bottom-6 left-0 right-[349px] flex justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-[#111111] rounded-full px-5 py-[11px] shadow-2xl">
            {/* Mic indicator */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isRecording ? 'bg-recording-icon' : 'bg-[#555]'}`}>
              <IconMic width={14} height={14} className="text-white" />
            </div>

            {/* Timer */}
            <span className="text-white font-bold tabular-nums text-[15px] min-w-[44px]">
              {formatTime(elapsed)}
            </span>

            <div className="w-px h-4 bg-white/20" />

            {/* Controls */}
            {isRecording ? (
              <button
                onClick={handlePause}
                className="text-[14px] text-white/80 hover:text-white bg-transparent border-none cursor-pointer px-1"
              >
                ⏸ 일시정지
              </button>
            ) : (
              <>
                <button
                  onClick={handleResume}
                  className="text-[14px] text-white/70 hover:text-white bg-transparent border-none cursor-pointer px-1"
                >
                  ▶ 계속
                </button>
                <button
                  onClick={handleFinish}
                  className="text-[13px] text-white bg-primary rounded-full px-4 py-1.5 border-none cursor-pointer hover:opacity-85"
                >
                  끝내기
                </button>
                <button
                  onClick={handleDiscard}
                  className="text-[13px] text-white/40 hover:text-white/70 bg-transparent border-none cursor-pointer px-1"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  // Idle state
  return (
    <div className="flex flex-col items-center justify-center bg-card border border-card-border rounded-[10px] p-12 min-h-[582px]">
      {failed && (
        <div className="mb-6 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger text-center">
          분석 중 오류가 발생했습니다. 파일을 다시 업로드해 주세요.
        </div>
      )}
      <div className="w-32 h-32 rounded-full bg-[#c7c7c7] flex items-center justify-center mb-7">
        <IconMic width={64} height={64} className="text-white" />
      </div>
      <div className="text-[24px] font-semibold text-title mb-3">
        {failed ? '다시 업로드하기' : '녹음 시작하기'}
      </div>
      <div className="text-[16px] text-subtitle tracking-[-0.31px] mb-7">
        녹음을 시작하거나 녹음 파일을 업로드합니다.
      </div>
      <div className="flex flex-col gap-3 w-[220px]">
        <label className="flex items-center justify-center gap-[7px] w-full px-6 py-3 rounded-[10px] border-2 border-primary cursor-pointer text-[16px] text-primary tracking-[-0.31px]">
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
          className="flex items-center justify-center gap-[7px] w-full px-6 py-3 rounded-[10px] border-none cursor-pointer text-[16px] text-white bg-primary tracking-[-0.31px]"
        >
          ⏺ 녹음 시작
        </button>
      </div>
    </div>
  )
}
