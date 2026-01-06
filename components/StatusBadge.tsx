'use client'

import { TaskStatus } from '@/lib/supabase'

interface StatusBadgeProps {
  status: TaskStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    todo: { label: 'To Do', color: 'bg-gray-600 text-gray-200' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-600 text-yellow-100' },
    completed: { label: 'Completed', color: 'bg-green-600 text-green-100' },
  }

  const config = statusConfig[status]

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
