'use client'

import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: string
}

export default function StatCard({ title, value, icon, color = 'primary' }: StatCardProps) {
  return (
    <div className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <h3 className="text-white text-3xl font-bold">{value}</h3>
        </div>
        <div className={`w-16 h-16 bg-${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
          <div className={`text-${color} text-2xl`}>{icon}</div>
        </div>
      </div>
    </div>
  )
}
