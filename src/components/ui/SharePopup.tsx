'use client'

import { useEffect, useRef, useState } from 'react'

interface SharePopupProps {
  shareUrl: string | null
  isEnabling: boolean
  isDisabling: boolean
  onEnable: () => void
  onDisable: () => void
  onClose: () => void
}

export function SharePopup({
  shareUrl,
  isEnabling,
  isDisabling,
  onEnable,
  onDisable,
  onClose,
}: SharePopupProps) {
  const [copied, setCopied] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-lg w-[360px] p-4"
    >
      {shareUrl ? (
        <>
          <p className="text-sm font-semibold text-text-primary mb-1">공유 링크</p>
          <p className="text-xs text-text-tertiary mb-3">링크를 가진 누구나 읽기 전용으로 볼 수 있습니다.</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-xs text-text-secondary truncate select-all">
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 text-sm text-primary border border-primary rounded-md px-3 py-2 bg-transparent cursor-pointer hover:bg-primary/10 transition-colors"
            >
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          </div>
          <button
            onClick={onDisable}
            disabled={isDisabling}
            className="w-full text-sm text-danger border border-danger/40 rounded-md px-3 py-2 bg-transparent cursor-pointer hover:bg-danger/5 transition-colors disabled:opacity-40"
          >
            {isDisabling ? '해제 중...' : '공유 해제'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-text-primary mb-1">프로젝트 공유</p>
          <p className="text-xs text-text-tertiary mb-4">링크를 생성하면 누구나 읽기 전용으로 볼 수 있습니다.</p>
          <button
            onClick={onEnable}
            disabled={isEnabling}
            className="w-full text-sm text-primary border border-primary rounded-md px-3 py-2 bg-transparent cursor-pointer hover:bg-primary/10 transition-colors disabled:opacity-40"
          >
            {isEnabling ? '링크 생성 중...' : '링크 생성'}
          </button>
        </>
      )}
    </div>
  )
}
