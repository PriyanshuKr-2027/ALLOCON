'use client'

import { useEffect, useState } from 'react'
import { supabase, Task, User, Milestone } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import { FiPlus, FiCheckSquare, FiCalendar, FiUser } from 'react-icons/fi'

export default function TasksPage() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    milestone: '',
    module: '',
    deadline: '',
    assigned_to: '',
  })

  const isTeamLead = user?.role === 'team_lead'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [tasksRes, usersRes, milestonesRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*'),
      supabase.from('milestones').select('*').order('order', { ascending: true }),
    ])

    setTasks(tasksRes.data || [])
    setUsers(usersRes.data || [])
    setMilestones(milestonesRes.data || [])
    setLoading(false)
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.from('tasks').insert({
      ...formData,
      created_by: user?.id,
      status: 'todo',
      deadline: formData.deadline || null,
      assigned_to: formData.assigned_to || null,
    })

    if (!error) {
      const assignedUser = users.find(u => u.id === formData.assigned_to)
      await supabase.from('activity_logs').insert({
        action: 'task_created',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Created task "${formData.title}"${assignedUser ? ` and assigned to ${assignedUser.name}` : ''}`,
      })

      setFormData({
        title: '',
        description: '',
        milestone: '',
        module: '',
        deadline: '',
        assigned_to: '',
      })
      setIsAddModalOpen(false)
      fetchData()
    }
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTask) return

    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: formData.assigned_to })
      .eq('id', selectedTask.id)

    if (!error) {
      const assignedUser = users.find(u => u.id === formData.assigned_to)
      await supabase.from('activity_logs').insert({
        action: 'task_assigned',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Assigned task "${selectedTask.title}" to ${assignedUser?.name}`,
      })

      setIsAssignModalOpen(false)
      setSelectedTask(null)
      fetchData()
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId)
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (!error) {
      await supabase.from('activity_logs').insert({
        action: 'task_status_changed',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Changed task "${task?.title}" status to ${newStatus}`,
      })

      fetchData()
    }
  }

  const displayTasks = isTeamLead 
    ? tasks 
    : tasks.filter(t => t.assigned_to === user?.id)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Tasks</h1>
          <p className="text-gray-400">
            {isTeamLead 
              ? 'Manage and assign tasks to team members'
              : 'View your assigned tasks'}
          </p>
        </div>
        {isTeamLead && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <FiPlus />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Tasks List */}
      {displayTasks.length > 0 ? (
        <div className="space-y-4">
          {displayTasks.map((task) => {
            const assignedUser = users.find(u => u.id === task.assigned_to)
            return (
              <div
                key={task.id}
                className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white text-lg font-bold mb-2">{task.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      {task.milestone && (
                        <span className="text-gray-500">
                          📍 Milestone: {task.milestone}
                        </span>
                      )}
                      {task.module && (
                        <span className="text-gray-500">
                          📦 Module: {task.module}
                        </span>
                      )}
                      {task.deadline && (
                        <span className="text-gray-500 flex items-center space-x-1">
                          <FiCalendar />
                          <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        </span>
                      )}
                      {assignedUser && (
                        <span className="text-gray-500 flex items-center space-x-1">
                          <FiUser />
                          <span>{assignedUser.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <StatusBadge status={task.status as any} />
                  </div>
                </div>

                {isTeamLead && (
                  <div className="flex space-x-2 border-t border-gray-700 pt-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="bg-dark-bg border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedTask(task)
                        setFormData({ ...formData, assigned_to: task.assigned_to || '' })
                        setIsAssignModalOpen(true)
                      }}
                      className="bg-dark-bg border border-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:border-primary transition-colors"
                    >
                      {task.assigned_to ? 'Reassign' : 'Assign'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-dark-card p-12 rounded-xl border border-gray-700 text-center">
          <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckSquare className="text-gray-600 text-4xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">No Tasks</h3>
          <p className="text-gray-400 mb-6">
            {isTeamLead 
              ? 'Create your first task to get started.'
              : 'No tasks have been assigned to you yet.'}
          </p>
          {isTeamLead && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
            >
              <FiPlus />
              <span>Create Task</span>
            </button>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Task"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary resize-none"
              rows={3}
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Milestone</label>
              <select
                value={formData.milestone}
                onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="">Select milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.title}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Module</label>
              <input
                type="text"
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Select module"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="">Select member</option>
                {users.filter(u => u.status === 'active').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors"
          >
            Create Task
          </button>
        </form>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Task"
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            Assign task "{selectedTask?.title}" to a team member
          </p>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Select Team Member</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              required
            >
              <option value="">Select member</option>
              {users.filter(u => u.status === 'active').map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors"
          >
            Assign Task
          </button>
        </form>
      </Modal>
    </div>
  )
}
