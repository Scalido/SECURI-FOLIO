import { deriveAntiFolioOutcome } from '@/lib/anti-folio/verdict'
import { describe, expect, it } from 'vitest'

const title = {
  id: 'title-1',
  numero_cadastral: '1178',
  volume: 'AMA 171',
  folio: '68',
  nom_proprietaire: 'Amina Kabeya',
  circonscription: 'Kinshasa-Gombe',
  statut: 'Valide' as const,
}

describe('deriveAntiFolioOutcome', () => {
  it('classe zéro résultat comme introuvable, jamais comme fraude', () => {
    const outcome = deriveAntiFolioOutcome({ records: [] })

    expect(outcome.searchState).toBe('not_found')
    expect(outcome.administrativeStatus).toBeNull()
    expect(outcome.evidence.join(' ').toLowerCase()).not.toContain('fraude')
  })

  it('classe une erreur Supabase comme erreur technique', () => {
    const outcome = deriveAntiFolioOutcome({ searchError: true })

    expect(outcome.searchState).toBe('technical_error')
    expect(outcome.administrativeStatus).toBeNull()
    expect(outcome.requiresHumanReview).toBe(true)
  })

  it('classe plusieurs résultats comme ambiguïté', () => {
    const outcome = deriveAntiFolioOutcome({
      records: [title, { ...title, id: 'title-2', numero_cadastral: '1179' }],
    })

    expect(outcome.searchState).toBe('ambiguous')
    expect(outcome.administrativeStatus).toBeNull()
    expect(outcome.requiresHumanReview).toBe(true)
  })

  it('conserve Falsifié uniquement comme statut administratif existant', () => {
    const outcome = deriveAntiFolioOutcome({
      records: [{ ...title, statut: 'Falsifié' }],
    })

    expect(outcome.searchState).toBe('match')
    expect(outcome.administrativeStatus).toBe('Falsifié')
    expect(outcome.evidence.join(' ')).toContain('Falsifié')
  })

  it('exige une revue humaine lors d’un chevauchement', () => {
    const outcome = deriveAntiFolioOutcome({
      records: [title],
      spatialState: 'overlap_detected',
    })

    expect(outcome.spatialState).toBe('overlap_detected')
    expect(outcome.requiresHumanReview).toBe(true)
  })
})
