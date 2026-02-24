import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// Note: For Vite frontend, variables must start with VITE_ to be exposed.
// However, for Vercel Functions (backend), regular names like SUPABASE_URL work.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
