import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Check if user profile exists, if not create one for GitHub OAuth users
    if (data.user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      // If user doesn't exist in users table, create them
      if (!existingUser) {
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'GitHub User'
        
        await supabase.from('users').insert({
          id: data.user.id,
          name: name,
          email: data.user.email || '',
          role: 'member',
          status: 'active',
        })

        // Log activity
        await supabase.from('activity_logs').insert({
          action: 'member_added',
          user_id: data.user.id,
          user_name: name,
          details: `${name} signed up via GitHub OAuth`,
        })
      }
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
