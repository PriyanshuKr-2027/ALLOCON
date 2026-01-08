'use client'

import { useEffect, useState } from 'react'
import { supabase, ActivityLog } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { FiActivity } from 'react-icons/fi'

export default function ActivityLogPage() {
  const { activeOrgId, isTeamLeadInActiveOrg } = useAuthStore()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isTeamLeadInActiveOrg || !activeOrgId) {
      setLoading(false)
      return
    }

    const fetchActivities = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('org_id', activeOrgId)
        .order('created_at', { ascending: false })
        .limit(100)

      setActivities(data || [])
      setLoading(false)
    }

    fetchActivities()
  }, [isTeamLeadInActiveOrg, activeOrgId])

  if (!isTeamLeadInActiveOrg) {
    return (
      <div className="p-8">
        <div className="bg-dark-card p-12 rounded-xl border border-gray-700 text-center">
          <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <FiActivity className="text-gray-600 text-4xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Access Restricted</h3>
          <p className="text-gray-400">
            Activity logs are only visible to Team Leads.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      member_added: { text: 'Member Added', color: 'bg-green-500' },
      member_status_changed: { text: 'Status Changed', color: 'bg-yellow-500' },
      task_created: { text: 'Task Created', color: 'bg-blue-500' },
      task_assigned: { text: 'Task Assigned', color: 'bg-purple-500' },
      task_status_changed: { text: 'Status Updated', color: 'bg-cyan-500' },
      milestone_created: { text: 'Milestone Created', color: 'bg-pink-500' },
    }
    return labels[action] || { text: action, color: 'bg-gray-500' }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-3xl font-bold mb-2">Activity Log</h1>
        <p className="text-gray-400">Track all project activity and changes</p>
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => {
            const actionInfo = getActionLabel(activity.action)
            return (
              <div
                key={activity.id}
                className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-2 h-2 ${actionInfo.color} rounded-full mt-2 flex-shrink-0`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">{activity.user_name}</h3>
                      <span className="text-gray-500 text-sm">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`${actionInfo.color} bg-opacity-20 text-white text-xs px-2 py-1 rounded`}>
                        {actionInfo.text}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{activity.details}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-dark-card p-12 rounded-xl border border-gray-700 text-center">
          <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <FiActivity className="text-gray-600 text-4xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">No Activity Yet</h3>
          <p className="text-gray-400">
            Activity will appear here as team members work on tasks.
          </p>
        </div>
      )}
    </div>
  )
}
