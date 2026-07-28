export const LAND_FILE_PIECE_TYPES = [
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
] as const

export type LandFilePieceType = (typeof LAND_FILE_PIECE_TYPES)[number]

const CADASTRE_REQUIRED: readonly LandFilePieceType[] = [
  'pv_mesurage_bornage',
  'croquis',
]

const CONSERVATEUR_REQUIRED: readonly LandFilePieceType[] = [
  'minute_certificat',
  'preuve_paiement',
]

export type DocumentChecklist = {
  complete: boolean
  missing: LandFilePieceType[]
  cadastre: {
    ready: boolean
    missing: LandFilePieceType[]
  }
  conservateur: {
    ready: boolean
    missing: LandFilePieceType[]
  }
}

export function buildDocumentChecklist(
  presentTypes: readonly LandFilePieceType[],
): DocumentChecklist {
  const present = new Set(presentTypes)
  const cadastreMissing = CADASTRE_REQUIRED.filter(type => !present.has(type))
  const conservateurMissing = CONSERVATEUR_REQUIRED.filter(
    type => !present.has(type),
  )
  const missing = [...cadastreMissing, ...conservateurMissing]

  return {
    complete: missing.length === 0,
    missing,
    cadastre: {
      ready: cadastreMissing.length === 0,
      missing: cadastreMissing,
    },
    conservateur: {
      ready: conservateurMissing.length === 0,
      missing: conservateurMissing,
    },
  }
}

export function nextPieceVersion(existingVersions: readonly number[]) {
  return Math.max(0, ...existingVersions) + 1
}
