'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { FiMail, FiLock, FiUser, FiCheckSquare } from 'react-icons/fi'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setUser, setMemberships, setOrganizations, setActiveOrg } = useAuthStore()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name,
            email,
            status: 'active',
          })

        if (profileError && profileError.code !== '23505') {
          console.error('Profile creation error:', profileError)
        }

        // Create default organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName || `${name}'s Organization`,
            created_by: authData.user.id,
          })
          .select()
          .single()

        if (orgError) throw orgError

        // Add user to organization as team_lead (first user is always team lead)
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .insert({
            user_id: authData.user.id,
            org_id: orgData.id,
            role: 'team_lead',
          })
          .select()
          .single()

        if (memberError) throw memberError

        // Log activity
        try {
          await supabase.from('activity_logs').insert({
            org_id: orgData.id,
            action: 'user_joined',
            user_id: authData.user.id,
            user_name: name,
            details: `${name} created organization and signed up`,
          })
        } catch (logError) {
          console.error('Activity log error:', logError)
        }

        // Set user state
        setUser({
          id: authData.user.id,
          name,
          email,
          status: 'active',
          created_at: new Date().toISOString(),
        })

        // Set memberships and organizations
        setMemberships([memberData])
        setOrganizations([orgData])
        setActiveOrg(orgData.id)

        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <FiCheckSquare className="text-white text-3xl" />
          </div>
          <h1 className="text-white text-3xl font-bold">ALLOCON</h1>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-dark-card p-8 rounded-xl border border-gray-700">
          <h2 className="text-white text-2xl font-bold mb-6">Sign Up</h2>
          
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Organization Name (optional)</label>
              <div className="relative">
                <FiCheckSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">If left empty, will use {name && `${name}'s Organization`}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
