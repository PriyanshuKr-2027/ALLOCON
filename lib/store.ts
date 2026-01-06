import { create } from 'zustand'
import { User } from '@/lib/supabase'

interface AuthStore {
  user: User | null
  isTeamLead: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isTeamLead: false,
  setUser: (user) => set({ user, isTeamLead: user?.role === 'team_lead' }),
  logout: () => set({ user: null, isTeamLead: false }),
}))
