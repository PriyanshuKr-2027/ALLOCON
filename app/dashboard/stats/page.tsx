'use client'

import { useEffect, useState } from 'react'
import { supabase, Task, User } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import StatCard from '@/components/StatCard'
import { FiCheckSquare, FiCheck, FiClock, FiTrendingUp } from 'react-icons/fi'

export default function DashboardStatsPage() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: usersData } = await supabase
        .from('users')
        .select('*')

      setTasks(tasksData || [])
      setUsers(usersData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  // Calculate stats
  const isTeamLead = user?.role === 'team_lead'
  const userTasks = isTeamLead 
    ? tasks 
    : tasks.filter(t => t.assigned_to === user?.id)

  const totalTasks = userTasks.length
  const completedTasks = userTasks.filter(t => t.status === 'completed').length
  const inProgressTasks = userTasks.filter(t => t.status === 'in_progress').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Task distribution by member
  const memberDistribution = users.map(member => ({
    name: member.name,
    taskCount: tasks.filter(t => t.assigned_to === member.id).length,
    completed: tasks.filter(t => t.assigned_to === member.id && t.status === 'completed').length,
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
                  {userTasks.filter(t => t.status === 'todo').length}
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
      {isTeamLead && (
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700 mt-8">
          <h2 className="text-white text-xl font-bold mb-4">Member Task Distribution</h2>
          {memberDistribution.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 py-3 px-4">Member</th>
                    <th className="text-left text-gray-400 py-3 px-4">Total Tasks</th>
                    <th className="text-left text-gray-400 py-3 px-4">Completed</th>
                    <th className="text-left text-gray-400 py-3 px-4">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {memberDistribution.map((member, idx) => {
                    const progress = member.taskCount > 0 
                      ? Math.round((member.completed / member.taskCount) * 100) 
                      : 0
                    return (
                      <tr key={idx} className="border-b border-gray-800">
                        <td className="text-white py-3 px-4">{member.name}</td>
                        <td className="text-gray-400 py-3 px-4">{member.taskCount}</td>
                        <td className="text-gray-400 py-3 px-4">{member.completed}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-dark-bg rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-400 text-sm w-12">{progress}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No team member data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
