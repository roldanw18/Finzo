import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when valid Supabase credentials are configured. */
export const hasSupabase = Boolean(
  url && anonKey && url.startsWith('http') && anonKey.length > 20,
)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
