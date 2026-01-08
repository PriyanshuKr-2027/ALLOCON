'use client'

import { useEffect, useState } from 'react'
import { supabase, Task, User } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import StatCard from '@/components/StatCard'
import { FiCheckSquare, FiCheck, FiClock, FiTrendingUp } from 'react-icons/fi'

export default function DashboardStatsPage() {
  const { activeOrgId, isTeamLeadInActiveOrg } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('org_id', activeOrgId)
        .order('created_at', { ascending: false })

      const { data: membersData } = await supabase
        .from('organization_members')
        .select('*')
        .eq('org_id', activeOrgId)

      setTasks(tasksData || [])
      setMembers(membersData || [])
      setLoading(false)
    }

    if (activeOrgId) {
      fetchData()
    }
  }, [activeOrgId])

  // Calculate stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Task distribution by member (for team leads only)
  // Note: Full task assignment tracking requires task_assignments table UI integration
  const memberDistribution = members.map((member, idx) => ({
    id: member.user_id,
    role: member.role,
    index: idx,
  }))

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of all project tasks and team performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={<FiCheckSquare />}
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          icon={<FiCheck />}
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks}
          icon={<FiClock />}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<FiTrendingUp />}
        />
      </div>

      {/* Overall Progress */}
      <div className="bg-dark-card p-6 rounded-xl border border-gray-700 mb-8">
        <h2 className="text-white text-xl font-bold mb-4">Overall Progress</h2>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Task Completion</span>
            <span className="text-primary text-lg font-bold">{completionRate}%</span>
          </div>
          <div className="w-full bg-dark-bg rounded-full h-4">
            <div
              className="bg-primary h-4 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks by Milestone */}
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700">
          <h2 className="text-white text-xl font-bold mb-4">Tasks by Milestone</h2>
          <div className="text-center py-12">
            <p className="text-gray-500">
              {tasks.length > 0 ? 'Add milestones to see distribution' : 'No milestone data available'}
            </p>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700">
          <h2 className="text-white text-xl font-bold mb-4">Status Distribution</h2>
          {totalTasks > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">To Do</span>
                <span className="text-white font-medium">
                  {tasks.filter(t => t.status === 'todo').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">In Progress</span>
                <span className="text-white font-medium">{inProgressTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Completed</span>
                <span className="text-white font-medium">{completedTasks}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Member Task Distribution - Team Lead Only */}
      {isTeamLeadInActiveOrg && (
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700 mt-8">
          <h2 className="text-white text-xl font-bold mb-4">Member Task Distribution</h2>
          {memberDistribution.length > 0 ? (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm mb-4">
                {memberDistribution.length} member{memberDistribution.length > 1 ? 's' : ''} in organization
              </p>
              {memberDistribution.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
                >
                  <span className="text-gray-300 text-sm">
                    Member {member.index + 1}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    member.role === 'team_lead'
                      ? 'bg-primary bg-opacity-20 text-primary'
                      : 'bg-gray-700 bg-opacity-50 text-gray-400'
                  }`}>
                    {member.role === 'team_lead' ? 'Team Lead' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No team members in this organization</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
