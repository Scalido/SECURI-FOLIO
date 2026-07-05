import { createClient } from '@supabase/supabase-js'

// Client Supabase avec les droits d'administration (bypasse les RLS)
// Ne doit être utilisé que côté serveur (Server Actions ou Route Handlers)
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Variables d'environnement Supabase Admin manquantes.")
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
