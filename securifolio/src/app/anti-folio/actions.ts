'use server'

import { supabase } from '@/lib/supabaseClient'

export async function checkCadastralNumber(cadastralNumber: string) {
  if (!cadastralNumber) return null

  const { data, error } = await supabase
    .from('titres_fonciers')
    .select('*')
    .eq('numero_cadastral', cadastralNumber)

  if (error) {
    console.error('Erreur Supabase:', error)
    return null
  }

  return data
}
