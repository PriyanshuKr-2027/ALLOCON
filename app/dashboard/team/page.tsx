'use client'

import { useEffect, useState } from 'react'
import { supabase, OrganizationMember } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Modal from '@/components/Modal'
import { FiUsers, FiTrash2, FiAlertTriangle } from 'react-icons/fi'

export default function TeamPage() {
  const { activeOrgId, isTeamLeadInActiveOrg, user } = useAuthStore()
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [users, setUsers] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchTeamData()
  }, [activeOrgId])

  const fetchTeamData = async () => {
    if (!activeOrgId) {
      setLoading(false)
      return
    }

    // Fetch organization members
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', activeOrgId)
      .order('joined_at', { ascending: false })

    // Fetch user details for all members
    if (memberData && memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id)
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      const userMap = new Map()
      userData?.forEach(u => userMap.set(u.id, u))
      setUsers(userMap)
    }

    setMembers(memberData || [])
    setLoading(false)
  }

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!isTeamLeadInActiveOrg || !activeOrgId) return

    setMemberToDelete({ id: userId, name: memberName })
    setIsDeleteModalOpen(true)
  }

  const confirmRemoveMember = async () => {
    if (!memberToDelete || !isTeamLeadInActiveOrg || !activeOrgId) return

    // Delete member from organization
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', memberToDelete.id)
      .eq('org_id', activeOrgId)

    if (!error) {
      // Also remove their task assignments
      await supabase
        .from('task_assignments')
        .delete()
        .eq('user_id', memberToDelete.id)

      // Log activity
      await supabase.from('activity_logs').insert({
        org_id: activeOrgId,
        action: 'member_removed',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Removed member ${memberToDelete.name} from organization`,
      })

      setIsDeleteModalOpen(false)
      setMemberToDelete(null)
      fetchTeamData()
    }
  }

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
          <p className="text-gray-400">Manage your organization members</p>
        </div>
      </div>

      {/* Members List */}
      {members.length > 0 ? (
        <div className="space-y-4">
          {members.map((member) => {
            const memberUser = users.get(member.user_id)
            return (
              <div
                key={member.id}
                className="bg-dark-card p-6 rounded-xl border border-gray-700 flex items-center justify-between hover:border-primary transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {memberUser?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{memberUser?.name}</h3>
                    <p className="text-gray-400 text-sm">{memberUser?.email}</p>
                    <p className="text-primary text-xs mt-1 font-medium">
                      {member.role === 'team_lead' ? 'Team Lead' : 'Member'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {member.user_id === user?.id && (
                    <span className="text-xs bg-primary bg-opacity-20 text-primary px-3 py-1 rounded">
                      You
                    </span>
                  )}
                  {isTeamLeadInActiveOrg && member.user_id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id, memberUser?.name || 'Member')}
                      className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-dark-hover transition-colors"
                      title="Remove member"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-dark-card p-12 rounded-xl border border-gray-700 text-center">
          <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="text-gray-600 text-4xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">No Members Yet</h3>
          <p className="text-gray-400">
            Invite team members to join your organization. They can sign up and join via the shared organization link.
          </p>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setMemberToDelete(null)
        }}
        title="Remove Member"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
            <FiAlertTriangle className="text-red-400 text-xl flex-shrink-0" />
            <p className="text-red-300 text-sm">
              This action cannot be undone. The member will be removed from the organization and their task assignments will be cleared.
            </p>
          </div>

          {memberToDelete && (
            <div className="p-3 bg-dark-bg rounded-lg">
              <p className="text-white text-sm">
                <span className="font-bold">Removing:</span> {memberToDelete.name}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false)
                setMemberToDelete(null)
              }}
              className="flex-1 bg-dark-bg border border-gray-700 text-white py-3 rounded-lg font-medium hover:border-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveMember}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Remove Member</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
