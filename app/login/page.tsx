'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { FiMail, FiLock, FiCheckSquare } from 'react-icons/fi'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setUser } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (data.user) {
        // Fetch user details from users table
        let { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        // If user not found, create profile automatically
        if (!userData && !userError) {
          const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              name,
              email: data.user.email || '',
              role: 'member',
              status: 'active',
            })

          if (!createError) {
            userData = {
              id: data.user.id,
              name,
              email: data.user.email || '',
              role: 'member',
              status: 'active',
              created_at: new Date().toISOString(),
            }
          }
        }

        if (userError && userError.code !== 'PGRST116') throw userError

        if (!userData) {
          setError('Unable to create user profile. Please try again.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        if (userData.status === 'inactive') {
          setError('Your account is inactive. Please contact your team lead.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        setUser(userData)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login')
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
          <h1 className="text-white text-3xl font-bold">ChatBot RBAC</h1>
          <p className="text-gray-400 mt-2">Company Internal Chatbot with Role-Based Access Control</p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-card p-8 rounded-xl border border-gray-700">
          <h2 className="text-white text-2xl font-bold mb-6">Sign In</h2>
          
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
