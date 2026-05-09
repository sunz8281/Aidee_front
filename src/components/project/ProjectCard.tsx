'use client'

import Link from 'next/link'
import type { ProjectSummary } from '@/types'
import { IconChat, IconCalendar } from '@/components/icons'

interface ProjectCardProps {
  project: ProjectSummary
}

export function ProjectCard({ project }: ProjectCardProps) {
  const lastUpdate = new Date(project.updatedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '-').replace('.', '')

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-card border border-border rounded-lg p-5 pb-6 min-h-[140px] cursor-pointer transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        {/* Icon */}
        <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center mb-3">
          <IconChat width={20} height={20} className="text-primary" />
        </div>

        {/* Name */}
        <div className="text-lg font-semibold text-text-primary mb-2">
          {project.name}
        </div>

        {/* Meta */}
        <div className="text-sm text-text-tertiary leading-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <IconChat width={13} height={13} className="text-text-tertiary opacity-50" />
              <span>{project.meetingsCount}개 회의</span>
            </div>
            <div className="flex items-center gap-1">
              <IconCalendar width={13} height={13} className="text-text-tertiary opacity-50" />
              <span>{project.schedulesCount}개 일정</span>
            </div>
          </div>
          <div>마지막 업데이트: {lastUpdate}</div>
        </div>
      </div>
    </Link>
  )
}
