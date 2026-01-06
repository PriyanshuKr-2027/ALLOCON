'use client'

import { useEffect, useState } from 'react'
import { supabase, Milestone } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Modal from '@/components/Modal'
import { FiPlus, FiTarget } from 'react-icons/fi'

export default function MilestonesPage() {
  const { user } = useAuthStore()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    description: '',
  })

  const isTeamLead = user?.role === 'team_lead'

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .order('order', { ascending: true })

    setMilestones(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.from('milestones').insert({
      ...formData,
      order: milestones.length + 1,
    })

    if (!error) {
      // Log activity
      await supabase.from('activity_logs').insert({
        action: 'milestone_created',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Created milestone: ${formData.title}`,
      })

      setFormData({ title: '', duration: '', description: '' })
      setIsModalOpen(false)
      fetchMilestones()
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading milestones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Milestones & Modules</h1>
          <p className="text-gray-400">Project timeline and deliverables</p>
        </div>
        {isTeamLead && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <FiPlus />
            <span>Add Milestone</span>
          </button>
        )}
      </div>

      {/* Milestones List */}
      {milestones.length > 0 ? (
        <div className="space-y-6">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiTarget className="text-primary text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{milestone.description}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">Duration: {milestone.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card p-12 rounded-xl border border-gray-700 text-center">
          <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTarget className="text-gray-600 text-4xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">No Milestones Yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first milestone to start tracking project progress.
          </p>
          {isTeamLead && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
            >
              <FiPlus />
              <span>Create Milestone</span>
            </button>
          )}
        </div>
      )}

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Milestone"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Milestone title"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              placeholder="e.g., 2 weeks"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary resize-none"
              rows={4}
              placeholder="Describe this milestone"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors"
          >
            Create Milestone
          </button>
        </form>
      </Modal>
    </div>
  )
}
