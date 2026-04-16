'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const supabase = createClientSupabase()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
      } catch (error) {
        console.error('Logout error:', error)
        router.push('/login')
      }
    }

    handleLogout()
  }, [router])

  return null
}
