'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // Use email/password as requested for an MVP (could be Magic Link later)
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Identifiants invalides ou compte non autorisé.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.role === 'chef_cadastre') {
        revalidatePath('/cadastre-dashboard')
        redirect('/cadastre-dashboard')
      } else if (profile.role === 'conservateur') {
        revalidatePath('/conservateur-dashboard')
        redirect('/conservateur-dashboard')
      }
    }
  }

  revalidatePath('/smart-archive')
  redirect('/smart-archive')
}
