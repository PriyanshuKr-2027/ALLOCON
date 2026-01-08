'use client'

import { useEffect, useState } from 'react'
import { supabase, Task } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import AIChatbot from '@/components/AIChatbot'
import { FiPlus, FiCheckSquare, FiCalendar, FiUsers, FiX } from 'react-icons/fi'

export default function TasksPage() {
  const { user, activeOrgId, isTeamLeadInActiveOrg } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [taskAssignments, setTaskAssignments] = useState<Map<string, string[]>>(new Map())
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    milestone: '',
    module: '',
    deadline: '',
  })

  useEffect(() => {
    fetchData()
  }, [activeOrgId])

  const fetchData = async () => {
    if (!activeOrgId) {
      setLoading(false)
      return
    }

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('org_id', activeOrgId)
      .order('created_at', { ascending: false })

    const { data: membersData } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', activeOrgId)

    // Fetch task assignments
    const { data: assignmentsData } = await supabase
      .from('task_assignments')
      .select('*')

    const assignmentMap = new Map<string, string[]>()
    assignmentsData?.forEach(assignment => {
      if (!assignmentMap.has(assignment.task_id)) {
        assignmentMap.set(assignment.task_id, [])
      }
      assignmentMap.get(assignment.task_id)!.push(assignment.user_id)
    })

    setTasks(tasksData || [])
    setMembers(membersData || [])
    setTaskAssignments(assignmentMap)
    setLoading(false)
  }

  const handleAssignMembers = async () => {
    if (!selectedTaskId) return

    // Remove old assignments for this task
    await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', selectedTaskId)

    // Add new assignments
    if (selectedMembers.length > 0) {
      const assignments = selectedMembers.map(memberId => ({
        task_id: selectedTaskId,
        user_id: memberId,
      }))

      const { error } = await supabase
        .from('task_assignments')
        .insert(assignments)

      if (!error) {
        await supabase.from('activity_logs').insert({
          org_id: activeOrgId,
          action: 'task_assigned',
          user_id: user?.id,
          user_name: user?.name || '',
          details: `Assigned task to ${selectedMembers.length} member(s)`,
        })

        setIsAssignModalOpen(false)
        setSelectedTaskId(null)
        setSelectedMembers([])
        fetchData()
      }
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isTeamLeadInActiveOrg || !user?.id || !activeOrgId) return

    const { error } = await supabase.from('tasks').insert({
      org_id: activeOrgId,
      title: formData.title,
      description: formData.description,
      milestone: formData.milestone,
      module: formData.module,
      created_by: user.id,
      status: 'todo',
      deadline: formData.deadline || null,
    })

    if (!error) {
      await supabase.from('activity_logs').insert({
        org_id: activeOrgId,
        action: 'task_created',
        user_id: user.id,
        user_name: user.name || '',
        details: `Created task "${formData.title}"`,
      })

      setFormData({
        title: '',
        description: '',
        milestone: '',
        module: '',
        deadline: '',
      })
      setIsAddModalOpen(false)
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
        org_id: activeOrgId,
        action: 'task_status_changed',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Changed task "${task?.title}" status to ${newStatus}`,
      })

      fetchData()
    }
  }

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
            {isTeamLeadInActiveOrg 
              ? 'Manage and assign tasks to team members'
              : 'View your assigned tasks'}
          </p>
        </div>
        {isTeamLeadInActiveOrg && (
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
      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => {
            const assignedMembers = taskAssignments.get(task.id) || []
            const assignedMemberDetails = members.filter(m => assignedMembers.includes(m.user_id))
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
                    </div>

                    {/* Assigned Members */}
                    {assignedMemberDetails.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {assignedMemberDetails.map((member) => (
                          <span
                            key={member.id}
                            className="inline-flex items-center space-x-1 bg-primary bg-opacity-20 text-primary text-xs px-2 py-1 rounded"
                          >
                            <span>👤 {member.user_id}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <StatusBadge status={task.status as any} />
                  </div>
                </div>

                {isTeamLeadInActiveOrg && (
                  <div className="flex space-x-2 border-t border-gray-700 pt-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="flex-1 bg-dark-bg border border-gray-700 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedTaskId(task.id)
                        setSelectedMembers(assignedMembers)
                        setIsAssignModalOpen(true)
                      }}
                      className="bg-dark-bg border border-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:border-primary transition-colors flex items-center space-x-2"
                    >
                      <FiUsers className="w-4 h-4" />
                      <span>Assign ({assignedMembers.length})</span>
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
            {isTeamLeadInActiveOrg 
              ? 'Create your first task to get started.'
              : 'No tasks have been assigned to you yet.'}
          </p>
          {isTeamLeadInActiveOrg && (
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
        title="Add New Task"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Task Title</label>
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
              <input
                type="text"
                value={formData.milestone}
                onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Select milestone"
              />
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

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors"
          >
            Create Task
          </button>
        </form>
      </Modal>

      {/* Assign Members Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false)
          setSelectedTaskId(null)
          setSelectedMembers([])
        }}
        title="Assign Members to Task"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Select team members to assign to this task. They can work together on it.
          </p>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {members.length > 0 ? (
              members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center space-x-3 p-3 bg-dark-bg rounded-lg cursor-pointer hover:bg-dark-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.user_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member.user_id])
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== member.user_id))
                      }
                    }}
                    className="w-4 h-4 rounded bg-primary border-gray-600"
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Member {member.user_id.slice(0, 8)}</p>
                    <p className="text-gray-500 text-xs">
                      {member.role === 'team_lead' ? 'Team Lead' : 'Member'}
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No members available</p>
            )}
          </div>

          {selectedMembers.length > 0 && (
            <div className="bg-primary bg-opacity-10 border border-primary border-opacity-30 rounded-lg p-3">
              <p className="text-primary text-sm">
                ✓ {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsAssignModalOpen(false)
                setSelectedTaskId(null)
                setSelectedMembers([])
              }}
              className="flex-1 bg-dark-bg border border-gray-700 text-white py-2 rounded-lg text-sm hover:border-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignMembers}
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Assign Members
            </button>
          </div>
        </div>
      </Modal>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  )
}
