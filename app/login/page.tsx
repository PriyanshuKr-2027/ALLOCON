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
  const [githubLoading, setGithubLoading] = useState(false)
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-card text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              console.log('GitHub login button clicked')
              setGithubLoading(true)
              setError('')
              try {
                console.log('Starting GitHub OAuth flow...')
                const { data, error: githubError } = await supabase.auth.signInWithOAuth({
                  provider: 'github',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                })
                console.log('GitHub OAuth response:', { data, githubError })
                if (githubError) {
                  console.error('GitHub OAuth error:', githubError)
                  setError(`GitHub Error: ${githubError.message}`)
                  setGithubLoading(false)
                }
              } catch (err: any) {
                console.error('GitHub login exception:', err)
                setError(err.message || 'Failed to sign in with GitHub')
                setGithubLoading(false)
              }
            }}
            disabled={githubLoading}
            className="w-full bg-dark-bg border border-gray-700 text-white py-3 rounded-lg font-medium hover:border-primary transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {githubLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.092-.937.35-1.546.636-1.903-2.22-.253-4.555-1.112-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.193 20 14.441 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
            )}
            <span>{githubLoading ? 'Signing in...' : 'Sign in with GitHub'}</span>
          </button>

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
