import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let client: SupabaseClient | null = null

// Client-side Supabase (for browser) - singleton pattern
export const createClientSupabase = () => {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}
