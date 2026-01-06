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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setUser } = useAuthStore()

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
        // Try to create user profile - by default, new users are members
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name,
            email,
            role: 'member',
            status: 'active',
          })

        // Log profile creation error but don't fail signup
        if (profileError && profileError.code !== '23505') {
          // 23505 is unique constraint violation - user already exists
          console.error('Profile creation error:', profileError)
        }

        // Try to log activity (don't fail if it errors)
        try {
          await supabase.from('activity_logs').insert({
            action: 'member_added',
            user_id: authData.user.id,
            user_name: name,
            details: `${name} signed up with email ${email}`,
          })
        } catch (logError) {
          console.error('Activity log error:', logError)
        }

        // Set user in store and auto-login
        setUser({
          id: authData.user.id,
          name,
          email,
          role: 'member',
          status: 'active',
          created_at: new Date().toISOString(),
        })

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
