'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  FiHome, FiBarChart2, FiTarget, FiUsers, FiCheckSquare, 
  FiFileText, FiActivity, FiLogOut, FiChevronDown
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: FiHome },
  { name: 'Dashboard', path: '/dashboard/stats', icon: FiBarChart2 },
  { name: 'Milestones', path: '/dashboard/milestones', icon: FiTarget },
  { name: 'Team', path: '/dashboard/team', icon: FiUsers },
  { name: 'Tasks', path: '/dashboard/tasks', icon: FiCheckSquare },
  { name: 'Resources', path: '/dashboard/resources', icon: FiFileText },
  { name: 'Activity Log', path: '/dashboard/activity', icon: FiActivity },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, activeOrgId, organizations, memberships, isTeamLeadInActiveOrg, setActiveOrg, logout } = useAuthStore()
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)

  const activeOrg = organizations.find(org => org.id === activeOrgId)
  const activeRole = memberships.find(m => m.org_id === activeOrgId)?.role

  const handleOrgChange = (orgId: string) => {
    setActiveOrg(orgId)
    setShowOrgDropdown(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  return (
    <div className="w-64 bg-dark-card h-screen flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FiCheckSquare className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">ALLOCON</h1>
          </div>
        </div>

        {/* Organization Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="w-full bg-dark-hover border border-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:border-primary transition-colors"
          >
            <span className="truncate">{activeOrg?.name || 'Select Org'}</span>
            <FiChevronDown className={`transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showOrgDropdown && organizations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-dark-hover border border-gray-600 rounded-lg shadow-lg z-50">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgChange(org.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-primary transition-colors ${
                    org.id === activeOrgId ? 'bg-primary text-white' : 'text-gray-300'
                  }`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          // Hide Activity Log for non-team leads
          if (item.path === '/dashboard/activity' && !isTeamLeadInActiveOrg) {
            return null
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <Icon className="text-xl" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-primary">
              {isTeamLeadInActiveOrg ? 'Team Lead' : 'Member'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-gray-400 hover:text-white w-full px-4 py-2 rounded-lg hover:bg-dark-hover transition-colors"
        >
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
