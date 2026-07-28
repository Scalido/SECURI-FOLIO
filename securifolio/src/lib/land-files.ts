export const LAND_FILE_PIECE_TYPES = [
  'demande_terre',
  'demande_certificat_enregistrement',
  'demande_travaux_cadastre',
  'ordre_mission',
  'attestation_occupation',
  'fiche_parcellaire',
  'fiche_cadastrale',
  'plan_parcellaire',
  'plan_terrain',
  'photographie_aerienne',
  'procuration',
  'pv_enquete_prealable',
  'pv_mesurage_bornage',
  'pv_constat_lieux',
  'pv_mise_en_valeur',
  'croquis',
  'contrat_concession',
  'contrat_location',
  'permis_construire',
  'livret_logeur',
  'acte_vente',
  'acte_cession',
  'acte_coutumier',
  'jugement_investiture',
  'acte_donation',
  'acte_echange',
  'attestation_cession_propriete',
  'attestation_apurement_dette',
  'note_frais',
  'note_perception',
  'bordereau_versement',
  'attestation_paiement_banque',
  'minute_certificat',
  'certificat_enregistrement',
  'fiche_domaniale',
  'lettre_transmission',
  'accuse_reception',
  'copie_certifiee',
  'autre',
] as const

export type LandFilePieceType = (typeof LAND_FILE_PIECE_TYPES)[number]

type LandFilePieceDefinition = {
  label: string
  form?: string
}

export const LAND_FILE_PIECE_DEFINITIONS: Record<
  LandFilePieceType,
  LandFilePieceDefinition
> = {
  demande_terre: {
    label: 'Demande de terre',
    form: 'Guide : requête écrite, sous pli recommandé avec accusé de réception.',
  },
  demande_certificat_enregistrement: {
    label: 'Lettre de demande d’établissement du certificat d’enregistrement',
  },
  demande_travaux_cadastre: {
    label: 'Demande de travaux au cadastre',
  },
  ordre_mission: {
    label: 'Ordre de mission',
  },
  attestation_occupation: {
    label: 'Attestation d’occupation',
  },
  fiche_parcellaire: {
    label: 'Fiche parcellaire',
  },
  fiche_cadastrale: {
    label: 'Fiche cadastrale',
  },
  plan_parcellaire: {
    label: 'Plan parcellaire',
  },
  plan_terrain: {
    label: 'Plan du terrain',
  },
  photographie_aerienne: {
    label: 'Photographie aérienne',
  },
  procuration: {
    label: 'Procuration du mandataire',
  },
  pv_enquete_prealable: {
    label: 'Procès-verbal d’enquête préalable',
    form: 'Guide : deux exemplaires transmis sous pli recommandé avec accusé de réception.',
  },
  pv_mesurage_bornage: {
    label: 'Procès-verbal de mesurage et bornage',
    form: 'Guide : trois exemplaires, signés par le géomètre et le concessionnaire.',
  },
  pv_constat_lieux: {
    label: 'Procès-verbal de constat des lieux',
  },
  pv_mise_en_valeur: {
    label: 'Procès-verbal de mise en valeur',
  },
  croquis: {
    label: 'Croquis du terrain',
    form: 'Guide : signé par le Chef de division du cadastre ; jaune pour la location, rouge pour la concession perpétuelle et vert pour l’emphytéose.',
  },
  contrat_concession: {
    label: 'Contrat de concession',
  },
  contrat_location: {
    label: 'Contrat de location',
  },
  permis_construire: {
    label: 'Permis de construire',
  },
  livret_logeur: {
    label: 'Livret de logeur',
  },
  acte_vente: {
    label: 'Acte de vente',
  },
  acte_cession: {
    label: 'Acte de cession',
  },
  acte_coutumier: {
    label: 'Acte coutumier',
  },
  jugement_investiture: {
    label: 'Jugement d’investiture',
  },
  acte_donation: {
    label: 'Acte de donation',
  },
  acte_echange: {
    label: 'Acte d’échange',
  },
  attestation_cession_propriete: {
    label: 'Attestation de cession de propriété',
  },
  attestation_apurement_dette: {
    label: 'Attestation d’apurement de la dette',
  },
  note_frais: {
    label: 'Note de frais (feuille de calcul)',
  },
  note_perception: {
    label: 'Note de perception',
  },
  bordereau_versement: {
    label: 'Bordereau de versement délivré par la banque',
    form: 'Guide : preuve bancaire du paiement présentée au Comptable public.',
  },
  attestation_paiement_banque: {
    label: 'Attestation de paiement délivrée par la banque',
    form: 'Guide : accompagne le bordereau de versement afin d’éviter les fraudes.',
  },
  minute_certificat: {
    label: 'Minute du certificat d’enregistrement',
  },
  certificat_enregistrement: {
    label: 'Certificat d’enregistrement',
    form: 'Guide : deux exemplaires ; certificat daté, scellé et signé par le Conservateur.',
  },
  fiche_domaniale: {
    label: 'Fiche domaniale',
  },
  lettre_transmission: {
    label: 'Lettre de transmission',
  },
  accuse_reception: {
    label: 'Accusé de réception',
  },
  copie_certifiee: {
    label: 'Copie certifiée conforme',
  },
  autre: {
    label: 'Autre pièce de soubassement',
  },
}

export const LAND_FILE_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export type LandFileFormat = {
  extension: 'pdf' | 'jpg' | 'png'
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png'
}

export function detectLandFileFormat(
  bytes: Uint8Array,
): LandFileFormat | null {
  if (
    bytes.length >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d
  ) {
    return { extension: 'pdf', mimeType: 'application/pdf' }
  }

  if (
    bytes.length >= 3
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff
  ) {
    return { extension: 'jpg', mimeType: 'image/jpeg' }
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (
    bytes.length >= pngSignature.length
    && pngSignature.every((byte, index) => bytes[index] === byte)
  ) {
    return { extension: 'png', mimeType: 'image/png' }
  }

  return null
}

const CADASTRE_REQUIRED: readonly LandFilePieceType[] = [
  'pv_mesurage_bornage',
  'croquis',
]

const CONSERVATEUR_REQUIRED: readonly LandFilePieceType[] = [
  'minute_certificat',
  'bordereau_versement',
  'attestation_paiement_banque',
]

export type DocumentChecklist = {
  validationReady: boolean
  missing: LandFilePieceType[]
  versions: Partial<Record<LandFilePieceType, number>>
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
  versions: Partial<Record<LandFilePieceType, number>> = {},
): DocumentChecklist {
  const present = new Set(presentTypes)
  const cadastreMissing = CADASTRE_REQUIRED.filter(type => !present.has(type))
  const conservateurMissing = CONSERVATEUR_REQUIRED.filter(
    type => !present.has(type),
  )
  const missing = [...cadastreMissing, ...conservateurMissing]

  return {
    validationReady: missing.length === 0,
    missing,
    versions,
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
