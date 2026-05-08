'use client'

import Link from 'next/link'
import type { ProjectSummary } from '@/types'

interface ProjectCardProps {
  project: ProjectSummary
}

export function ProjectCard({ project }: ProjectCardProps) {
  const lastUpdate = new Date(project.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '-').replace('.', '')

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className="cursor-pointer transition-shadow"
        style={{
          background: '#ffffff',
          border: '1px solid #E5E5E5',
          borderRadius: 12,
          padding: '20px 20px 24px',
          minHeight: 140,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#EEF2FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="#3B5BDB"
            />
          </svg>
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: 8,
          }}
        >
          {project.name}
        </div>

        {/* Meta */}
        <div style={{ fontSize: 12, color: '#9E9E9E', lineHeight: '20px' }}>
          <div className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="#9E9E9E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            2개 회의
          </div>
          <div>마지막 업데이트: {lastUpdate}</div>
        </div>
      </div>
    </Link>
  )
}
