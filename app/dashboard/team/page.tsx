'use client'

import { useEffect, useState } from 'react'
import { supabase, User } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Modal from '@/components/Modal'
import { FiPlus, FiUsers, FiToggleLeft, FiToggleRight } from 'react-icons/fi'

export default function TeamPage() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isTeamLead = user?.role === 'team_lead'

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    setMembers(data || [])
    setLoading(false)
  }

  const toggleMemberStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', memberId)

    if (!error) {
      // Log activity
      const member = members.find(m => m.id === memberId)
      await supabase.from('activity_logs').insert({
        action: 'member_status_changed',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Changed ${member?.name}'s status to ${newStatus}`,
      })

      fetchMembers()
    }
  }

  const filteredMembers = members.filter(m => m.status === activeTab)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading team members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Team Members</h1>
          <p className="text-gray-400">Manage your project team</p>
        </div>
        {isTeamLead && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <FiPlus />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Active ({members.filter(m => m.status === 'active').length})
        </button>
        <button
          onClick={() => setActiveTab('inactive')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'inactive'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Inactive ({members.filter(m => m.status === 'inactive').length})
        </button>
      </div>

      {/* Members List */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{member.name}</h3>
                    <p className="text-xs text-primary">
                      {member.role === 'team_lead' ? 'Team Lead' : 'Member'}
                    </p>
                  </div>
                </div>
                {member.id === user?.id && (
                  <span className="text-xs bg-primary bg-opacity-20 text-primary px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-4">{member.email}</p>

              {isTeamLead && member.id !== user?.id && (
                <button
                  onClick={() => toggleMemberStatus(member.id, member.status)}
                  className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {member.status === 'active' ? (
                    <>
                      <FiToggleRight className="text-xl text-green-500" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <FiToggleLeft className="text-xl text-gray-500" />
                      <span>Inactive</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card p-12 rounded-xl border border-gray-700 text-center">
          <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="text-gray-600 text-4xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">
            No {activeTab} members
          </h3>
          <p className="text-gray-400">
            {activeTab === 'active' 
              ? 'All members are currently inactive.'
              : 'All members are currently active.'}
          </p>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Team Member"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            To add team members, share the application URL with them. They can sign up with their email and password, and will automatically get the "Member" role. You can then activate or deactivate them from this page.
          </p>
          
          <div className="bg-dark-bg p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2">How to add team members:</h3>
            <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
              <li>Share the application URL with your team member</li>
              <li>They sign up with their email and password</li>
              <li>They automatically get "Member" role</li>
              <li>You can toggle their active/inactive status here</li>
            </ol>
          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  )
}
