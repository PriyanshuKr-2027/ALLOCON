import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'team_lead' | 'member'
export type UserStatus = 'active' | 'inactive'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  milestone?: string
  module?: string
  status: TaskStatus
  deadline?: string
  assigned_to?: string
  created_by: string
  created_at: string
}

export interface Milestone {
  id: string
  title: string
  duration: string
  description: string
  order: number
}

export interface ActivityLog {
  id: string
  action: string
  user_id: string
  user_name: string
  details: string
  created_at: string
}

export interface Resource {
  id: string
  title: string
  description?: string
  file_name: string
  file_path: string
  file_type: string
  file_size?: number
  uploaded_by: string
  created_at: string
}
