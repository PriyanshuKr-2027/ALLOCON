'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import StatCard from '@/components/StatCard'
import { FiTarget, FiCheckSquare, FiCheck, FiUsers } from 'react-icons/fi'
import { SiReact, SiTypescript, SiTailwindcss } from 'react-icons/si'

export default function OverviewPage() {
  const { user, activeOrgId } = useAuthStore()
  const [stats, setStats] = useState({
    totalMilestones: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
  })
  const [progress, setProgress] = useState({
    completed: 0,
    inProgress: 0,
    toDo: 0,
  })

  useEffect(() => {
    if (!activeOrgId) return

    const fetchStats = async () => {
      // Fetch milestones count for this org
      const { count: milestonesCount } = await supabase
        .from('milestones')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', activeOrgId)

      // Fetch tasks count for this org
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', activeOrgId)

      // Fetch completed tasks for this org
      const { count: completedCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', activeOrgId)
        .eq('status', 'completed')

      // Fetch members count for this org
      const { count: membersCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', activeOrgId)

      // Fetch task status distribution for this org
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('org_id', activeOrgId)

      const statusCounts = {
        completed: 0,
        inProgress: 0,
        toDo: 0,
      }

      allTasks?.forEach((task: { status: string }) => {
        if (task.status === 'completed') statusCounts.completed++
        else if (task.status === 'in_progress') statusCounts.inProgress++
        else statusCounts.toDo++
      })

      setStats({
        totalMilestones: milestonesCount || 0,
        totalTasks: tasksCount || 0,
        completedTasks: completedCount || 0,
        totalMembers: membersCount || 0,
      })

      setProgress(statusCounts)
    }

    fetchStats()
  }, [activeOrgId])

  const completionPercentage = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-3xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-400">
          Company Internal Chatbot with Role-Based Access Control
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Milestones"
          value={stats.totalMilestones}
          icon={<FiTarget />}
        />
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={<FiCheckSquare />}
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          icon={<FiCheck />}
        />
        <StatCard
          title="Team Members"
          value={stats.totalMembers}
          icon={<FiUsers />}
        />
      </div>

      {/* Project Progress */}
      <div className="bg-dark-card p-6 rounded-xl border border-gray-700 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <FiCheckSquare className="text-primary text-2xl" />
          <h2 className="text-white text-xl font-bold">Project Progress</h2>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Overall Completion</span>
            <span className="text-primary text-lg font-bold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-dark-bg rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Completed: {progress.completed}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-400">In Progress: {progress.inProgress}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-400">To Do: {progress.toDo}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Problem Statement */}
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700">
          <h2 className="text-white text-xl font-bold mb-4">Problem Statement</h2>
          <p className="text-gray-400 leading-relaxed">
            Organizations struggle with managing team access, task delegation, and project 
            documentation in a centralized, secure manner. This system provides a role-based 
            access control solution for internal chatbot project management.
          </p>
        </div>

        {/* Technology Stack */}
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700">
          <h2 className="text-white text-xl font-bold mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <SiReact className="text-primary text-2xl" />
              </div>
              <div>
                <p className="text-white font-medium">React</p>
                <p className="text-gray-500 text-xs">Frontend Framework</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <SiTypescript className="text-blue-500 text-2xl" />
              </div>
              <div>
                <p className="text-white font-medium">TypeScript</p>
                <p className="text-gray-500 text-xs">Type Safety</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-cyan-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <SiTailwindcss className="text-cyan-500 text-2xl" />
              </div>
              <div>
                <p className="text-white font-medium">Tailwind CSS</p>
                <p className="text-gray-500 text-xs">Styling</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-green-500 text-xl font-bold">S</span>
              </div>
              <div>
                <p className="text-white font-medium">Supabase</p>
                <p className="text-gray-500 text-xs">Backend & Auth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
