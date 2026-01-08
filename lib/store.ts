import { create } from 'zustand'
import { User, Organization, OrganizationMember } from '@/lib/supabase'

interface AuthStore {
  user: User | null
  memberships: OrganizationMember[]
  organizations: Organization[]
  activeOrgId: string | null
  isTeamLeadInActiveOrg: boolean
  setUser: (user: User | null) => void
  setMemberships: (memberships: OrganizationMember[]) => void
  setOrganizations: (organizations: Organization[]) => void
  setActiveOrg: (orgId: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  memberships: [],
  organizations: [],
  activeOrgId: null,
  isTeamLeadInActiveOrg: false,
  
  setUser: (user) => set({ user }),
  
  setMemberships: (memberships) => {
    const state = get()
    const isTeamLeadInActiveOrg = state.activeOrgId 
      ? memberships.some(m => m.org_id === state.activeOrgId && m.role === 'team_lead')
      : false
    set({ memberships, isTeamLeadInActiveOrg })
  },
  
  setOrganizations: (organizations) => set({ organizations }),
  
  setActiveOrg: (orgId) => {
    const state = get()
    const isTeamLeadInActiveOrg = orgId 
      ? state.memberships.some(m => m.org_id === orgId && m.role === 'team_lead')
      : false
    set({ activeOrgId: orgId, isTeamLeadInActiveOrg })
  },
  
  logout: () => set({
    user: null,
    memberships: [],
    organizations: [],
    activeOrgId: null,
    isTeamLeadInActiveOrg: false,
  }),
}))
