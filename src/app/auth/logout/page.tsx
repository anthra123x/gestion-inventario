'use client'

import { useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'

export default function LogoutPage() {
  useEffect(() => {
    const handleLogout = async () => {
      try {
        const supabase = createClientSupabase()
        await supabase.auth.signOut()
        window.location.href = '/login'
      } catch (error) {
        console.error('Logout error:', error)
        window.location.href = '/login'
      }
    }

    handleLogout()
  }, [])

  return null
}
