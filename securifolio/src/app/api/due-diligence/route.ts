import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit'

const MAX_NUMERO_LENGTH = 80

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rate = checkRateLimit(`due-diligence:${ip}`, 20, 60_000)

  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }, { status: 429 })
  }

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requête JSON invalide.' }, { status: 400 })
  }
  try {
    const { numeroCadastral } = body || {}

    if (typeof numeroCadastral !== 'string' || !numeroCadastral.trim() || numeroCadastral.length > MAX_NUMERO_LENGTH) {
      return NextResponse.json({ error: 'Numéro cadastral invalide.' }, { status: 400 })
    }

    const cleanSearch = numeroCadastral.trim()
    const volMatch = cleanSearch.match(/vol(?:ume)?\s+([a-z0-9\s]+?)\s+folio\s+(\d+)/i)

    const supabase = createAdminClient()

    let query = supabase
      .from('titres_fonciers')
      .select('numero_cadastral, circonscription, statut, date_enregistrement')

    if (volMatch) {
      const vol = volMatch[1].trim().toUpperCase()
      const fol = volMatch[2].trim()
      query = query.eq('volume', vol).eq('folio', fol)
    } else {
      query = query.eq('numero_cadastral', cleanSearch)
    }

    const { data, error } = await query.limit(1).maybeSingle()

    if (error) {
      console.error('Erreur due diligence:', error.code)
      return NextResponse.json({ error: 'Le registre est temporairement indisponible. Réessayez plus tard.' }, { status: 503 })
    }
    if (!data) return NextResponse.json({ error: 'Aucun titre foncier trouvé pour ce numéro cadastral.' }, { status: 404 })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erreur API due diligence:', error)
    return NextResponse.json({ error: 'Le registre est temporairement indisponible.' }, { status: 503 })
  }
}
