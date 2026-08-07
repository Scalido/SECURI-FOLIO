import { describe, expect, it } from 'vitest'

import { buildMapSearchCandidates } from '@/lib/map-search'

describe('buildMapSearchCandidates', () => {
  it.each([
    ['leopard, lemba', ['leopard, lemba']],
    ['léopard, lemba', ['léopard, lemba', 'leopard, lemba']],
    ['av. Leopard, Lemba', ['av. Leopard, Lemba', 'Leopard, Lemba']],
  ])('normalise %s sans perdre la requête originale', (query, expected) => {
    expect(buildMapSearchCandidates(query)).toEqual(expected)
  })

  it('retire seulement les localités intermédiaires dans le dernier repli', () => {
    expect(buildMapSearchCandidates('leopard, salongo, lemba')).toEqual([
      'leopard, salongo, lemba',
      'leopard, lemba',
    ])
  })

  it('nettoie accents, abréviations et séparateurs pour toute adresse', () => {
    expect(buildMapSearchCandidates('  Av. de l’ÉQUATEUR ,, Gombé  ')).toEqual([
      'Av. de l’ÉQUATEUR, Gombé',
      "de l'EQUATEUR, Gombe",
    ])
  })

  it('conserve le numéro de rue pendant la normalisation', () => {
    expect(buildMapSearchCandidates('12 av. Léopard, Lemba')).toEqual([
      '12 av. Léopard, Lemba',
      '12 Leopard, Lemba',
    ])
  })
})
