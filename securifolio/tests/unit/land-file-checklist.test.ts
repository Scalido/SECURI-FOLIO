import { describe, expect, it } from 'vitest'

import {
  buildDocumentChecklist,
  detectLandFileFormat,
  LAND_FILE_PIECE_DEFINITIONS,
  LAND_FILE_PIECE_TYPES,
  nextPieceVersion,
} from '@/lib/land-files'

describe('dossier foncier', () => {
  it('déclare complet un dossier qui contient les pièces de contrôle requises', () => {
    const checklist = buildDocumentChecklist([
      'pv_mesurage_bornage',
      'croquis',
      'minute_certificat',
      'bordereau_versement',
      'attestation_paiement_banque',
    ])

    expect(checklist.validationReady).toBe(true)
    expect(checklist.cadastre.ready).toBe(true)
    expect(checklist.conservateur.ready).toBe(true)
    expect(checklist.missing).toEqual([])
  })

  it('détaille sans ambiguïté les pièces manquantes', () => {
    const checklist = buildDocumentChecklist([
      'croquis',
      'bordereau_versement',
    ])

    expect(checklist.validationReady).toBe(false)
    expect(checklist.cadastre).toEqual({
      ready: false,
      missing: ['pv_mesurage_bornage'],
    })
    expect(checklist.conservateur).toEqual({
      ready: false,
      missing: ['minute_certificat', 'attestation_paiement_banque'],
    })
    expect(checklist.missing).toEqual([
      'pv_mesurage_bornage',
      'minute_certificat',
      'attestation_paiement_banque',
    ])
  })

  it('emploie la nomenclature documentaire du Guide sans catégorie de paiement vague', () => {
    expect(LAND_FILE_PIECE_TYPES).toEqual(expect.arrayContaining([
      'demande_terre',
      'demande_certificat_enregistrement',
      'demande_travaux_cadastre',
      'ordre_mission',
      'attestation_occupation',
      'fiche_parcellaire',
      'fiche_cadastrale',
      'pv_enquete_prealable',
      'pv_mesurage_bornage',
      'pv_constat_lieux',
      'pv_mise_en_valeur',
      'croquis',
      'contrat_concession',
      'contrat_location',
      'note_perception',
      'bordereau_versement',
      'attestation_paiement_banque',
      'minute_certificat',
      'certificat_enregistrement',
      'attestation_cession_propriete',
      'attestation_apurement_dette',
    ]))
    expect(LAND_FILE_PIECE_TYPES).not.toContain('demande')
    expect(LAND_FILE_PIECE_TYPES).not.toContain('pv_enquete')
    expect(LAND_FILE_PIECE_TYPES).not.toContain('preuve_paiement')
    expect(LAND_FILE_PIECE_DEFINITIONS.pv_mesurage_bornage.form).toContain(
      'trois exemplaires',
    )
    expect(LAND_FILE_PIECE_DEFINITIONS.certificat_enregistrement.form).toContain(
      'deux exemplaires',
    )
    expect(LAND_FILE_PIECE_DEFINITIONS.croquis.form).toContain(
      'signé par le Chef de division du cadastre',
    )
    expect(LAND_FILE_PIECE_DEFINITIONS.attestation_paiement_banque.label).toBe(
      'Attestation de paiement délivrée par la banque',
    )
  })

  it('détecte les formats techniques sur les octets, pas sur le nom de fichier', () => {
    expect(detectLandFileFormat(new TextEncoder().encode('%PDF-1.7'))).toEqual({
      extension: 'pdf',
      mimeType: 'application/pdf',
    })
    expect(detectLandFileFormat(new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0,
    ]))).toEqual({
      extension: 'jpg',
      mimeType: 'image/jpeg',
    })
    expect(detectLandFileFormat(new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]))).toEqual({
      extension: 'png',
      mimeType: 'image/png',
    })
    expect(detectLandFileFormat(new TextEncoder().encode('plain text')))
      .toBeNull()
  })

  it('versionne chaque remplacement sans écraser la version précédente', () => {
    expect(nextPieceVersion([])).toBe(1)
    expect(nextPieceVersion([1, 2, 4])).toBe(5)
  })
})
