import { describe, expect, it } from 'vitest'

import {
  buildDocumentChecklist,
  LAND_FILE_PIECE_TYPES,
  nextPieceVersion,
} from '@/lib/land-files'

describe('dossier foncier', () => {
  it('déclare complet un dossier qui contient les pièces de contrôle requises', () => {
    const checklist = buildDocumentChecklist([
      'pv_mesurage_bornage',
      'croquis',
      'minute_certificat',
      'preuve_paiement',
    ])

    expect(checklist.complete).toBe(true)
    expect(checklist.cadastre.ready).toBe(true)
    expect(checklist.conservateur.ready).toBe(true)
    expect(checklist.missing).toEqual([])
  })

  it('détaille sans ambiguïté les pièces manquantes', () => {
    const checklist = buildDocumentChecklist(['croquis', 'preuve_paiement'])

    expect(checklist.complete).toBe(false)
    expect(checklist.cadastre).toEqual({
      ready: false,
      missing: ['pv_mesurage_bornage'],
    })
    expect(checklist.conservateur).toEqual({
      ready: false,
      missing: ['minute_certificat'],
    })
    expect(checklist.missing).toEqual([
      'pv_mesurage_bornage',
      'minute_certificat',
    ])
  })

  it('conserve le vocabulaire documentaire approuvé', () => {
    expect(LAND_FILE_PIECE_TYPES).toEqual([
      'demande',
      'fiche_parcellaire',
      'pv_enquete',
      'pv_mesurage_bornage',
      'croquis',
      'contrat_concession',
      'preuve_paiement',
      'minute_certificat',
      'certificat_enregistrement',
      'copie_certifiee',
      'autre',
    ])
  })

  it('versionne chaque remplacement sans écraser la version précédente', () => {
    expect(nextPieceVersion([])).toBe(1)
    expect(nextPieceVersion([1, 2, 4])).toBe(5)
  })
})
