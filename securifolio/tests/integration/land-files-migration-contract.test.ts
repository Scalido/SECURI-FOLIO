import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260728060000_complete_land_files.sql',
  ),
  'utf8',
)

function functionDefinition(name: string) {
  const start = migration.indexOf(`FUNCTION public.${name}`)
  if (start < 0) throw new Error(`Fonction SQL absente: ${name}`)
  const end = migration.indexOf('$$ LANGUAGE plpgsql', start)
  if (end < 0) throw new Error(`Fin de fonction SQL absente: ${name}`)
  return migration.slice(start, end)
}

type LegacyTitle = {
  id: string
  numeroCadastral: string
  dossierId: string | null
  createdBy: string | null
}

type LegacyDossier = {
  id: string
  numeroDossier: string
}

function executeLegacyBackfill(
  titles: LegacyTitle[],
  dossiers: LegacyDossier[],
) {
  const nextTitles = structuredClone(titles)
  const nextDossiers = structuredClone(dossiers)

  for (const title of nextTitles) {
    if (title.dossierId !== null || title.createdBy === null) continue

    const numeroDossier = `${title.numeroCadastral}:legacy:${title.id}`
    let dossier = nextDossiers.find(
      (candidate) => candidate.numeroDossier === numeroDossier,
    )

    if (!dossier) {
      dossier = { id: `dossier-${title.id}`, numeroDossier }
      nextDossiers.push(dossier)
    }

    title.dossierId = dossier.id
  }

  return { titles: nextTitles, dossiers: nextDossiers }
}

describe('contrat SQL des dossiers fonciers', () => {
  it('crée les dossiers, les pièces immuables et le lien du titre', () => {
    expect(migration).toMatch(/CREATE TABLE[\s\S]+dossiers_fonciers/i)
    expect(migration).toMatch(/CREATE TABLE[\s\S]+pieces_dossier/i)
    expect(migration).toMatch(/dossier_id\s+UUID[\s\S]+REFERENCES\s+public\.dossiers_fonciers/i)
    expect(migration).toMatch(/UNIQUE\s*\(\s*dossier_id\s*,\s*type_piece\s*,\s*version\s*\)/i)
    expect(migration).toMatch(/ALTER TABLE\s+public\.titres_fonciers[\s\S]+dossier_id/i)
    expect(migration).not.toMatch(/UPDATE\s+public\.pieces_dossier/i)
  })

  it('backfill uniquement les enveloppes legacy et couple enveloppe/version', () => {
    const backfill = migration.match(
      /UPDATE\s+public\.titres_fonciers\s+SET\s+integrity_schema_version\s*=\s*1\s+WHERE([\s\S]+?);/i,
    )?.[1] || ''

    expect(backfill).toMatch(/integrity_schema_version\s+IS\s+NULL/i)
    expect(backfill).toMatch(/storage_path\s+IS\s+NOT\s+NULL/i)
    expect(backfill).toMatch(/file_sha256\s+IS\s+NOT\s+NULL/i)
    expect(backfill).toMatch(/metadata_hmac\s+IS\s+NOT\s+NULL/i)
    expect(backfill).toMatch(/document_version\s+IS\s+NOT\s+NULL/i)
    expect(migration).not.toMatch(
      /ALTER\s+COLUMN\s+integrity_schema_version\s+SET\s+NOT\s+NULL/i,
    )
    expect(migration).toMatch(
      /storage_path\s+IS\s+NULL[\s\S]+integrity_schema_version\s+IS\s+NULL[\s\S]+storage_path\s+IS\s+NOT\s+NULL[\s\S]+integrity_schema_version\s+IN\s*\(\s*1\s*,\s*2\s*\)/i,
    )
  })

  it('attribue un dossier distinct à chaque titre legacy, même avec un numéro cadastral répété', () => {
    const legacyTitles: LegacyTitle[] = [
      {
        id: 'title-a',
        numeroCadastral: 'CAD-001',
        dossierId: null,
        createdBy: 'agent-1',
      },
      {
        id: 'title-b',
        numeroCadastral: 'CAD-001',
        dossierId: null,
        createdBy: 'agent-1',
      },
      {
        id: 'title-c',
        numeroCadastral: 'CAD-002',
        dossierId: null,
        createdBy: 'agent-2',
      },
      {
        id: 'title-linked',
        numeroCadastral: 'CAD-003',
        dossierId: 'existing-dossier',
        createdBy: null,
      },
    ]
    const existingDossiers: LegacyDossier[] = [
      { id: 'existing-dossier', numeroDossier: 'CAD-003' },
    ]

    const firstRun = executeLegacyBackfill(legacyTitles, existingDossiers)
    const secondRun = executeLegacyBackfill(
      firstRun.titles,
      firstRun.dossiers,
    )

    expect(firstRun.titles.map((title) => title.dossierId)).toEqual([
      'dossier-title-a',
      'dossier-title-b',
      'dossier-title-c',
      'existing-dossier',
    ])
    expect(firstRun.dossiers.map((dossier) => dossier.numeroDossier)).toEqual([
      'CAD-003',
      'CAD-001:legacy:title-a',
      'CAD-001:legacy:title-b',
      'CAD-002:legacy:title-c',
    ])
    expect(new Set(firstRun.titles.map((title) => title.dossierId)).size).toBe(4)
    expect(secondRun).toEqual(firstRun)
  })

  it('ne fabrique aucun dossier lorsqu’aucun acteur legacy n’est attribuable', () => {
    const result = executeLegacyBackfill(
      [
        {
          id: 'title-without-actor',
          numeroCadastral: 'CAD-004',
          dossierId: null,
          createdBy: null,
        },
      ],
      [],
    )

    expect(result).toEqual({
      titles: [
        {
          id: 'title-without-actor',
          numeroCadastral: 'CAD-004',
          dossierId: null,
          createdBy: null,
        },
      ],
      dossiers: [],
    })
  })

  it('encode dans le SQL le rattachement legacy un-à-un sans écrasement', () => {
    expect(migration).toMatch(
      /CONCAT\s*\(\s*title\.numero_cadastral\s*,\s*':legacy:'\s*,\s*title\.id::TEXT\s*\)/i,
    )
    expect(migration).toMatch(
      /UPDATE\s+public\.titres_fonciers[\s\S]+SET\s+dossier_id\s*=\s*dossier\.id[\s\S]+title\.dossier_id\s+IS\s+NULL[\s\S]+dossier\.numero_dossier\s*=\s*CONCAT\s*\(\s*title\.numero_cadastral\s*,\s*':legacy:'\s*,\s*title\.id::TEXT\s*\)/i,
    )
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS titres_fonciers_dossier_id_unique/i,
    )
    expect(migration).toMatch(
      /JOIN LATERAL\s*\([\s\S]+history\.agent_id[\s\S]+history\.action_type\s*=\s*'insert'[\s\S]+\)\s+AS creation ON TRUE/i,
    )
    expect(migration).toMatch(
      /RAISE NOTICE[\s\S]+titres legacy restent sans dossier faute de provenance agent attribuable/i,
    )
  })

  it('alloue atomiquement une nouvelle version de pièce côté serveur', () => {
    expect(migration).toMatch(/FUNCTION\s+public\.add_dossier_piece/i)
    expect(migration).toMatch(/pg_advisory_xact_lock/i)
    expect(migration).toMatch(/MAX\s*\(\s*version\s*\)[\s\S]+\+\s*1/i)
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.add_dossier_piece[\s\S]+FROM PUBLIC/i)
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.add_dossier_piece[\s\S]+TO authenticated/i)
  })

  it('encode les types documentaires et les deux preuves bancaires du Guide', () => {
    expect(migration).toMatch(/'demande_terre'/)
    expect(migration).toMatch(/'demande_certificat_enregistrement'/)
    expect(migration).toMatch(/'demande_travaux_cadastre'/)
    expect(migration).toMatch(/'pv_enquete_prealable'/)
    expect(migration).toMatch(/'attestation_occupation'/)
    expect(migration).toMatch(/'pv_constat_lieux'/)
    expect(migration).toMatch(/'fiche_cadastrale'/)
    expect(migration).toMatch(/'contrat_location'/)
    expect(migration).toMatch(/'pv_mise_en_valeur'/)
    expect(migration).toMatch(/'bordereau_versement'/)
    expect(migration).toMatch(/'attestation_paiement_banque'/)
    expect(migration).toMatch(/'attestation_cession_propriete'/)
    expect(migration).toMatch(/'attestation_apurement_dette'/)
    expect(migration).not.toMatch(/'preuve_paiement'/)
    expect(migration).toMatch(/'validationReady'/)
    expect(migration).not.toMatch(/'complete'\s*,/)
  })

  it('bloque les approbations sans pièces ou justification de contrôle', () => {
    const guard = functionDefinition('update_title_status_with_history')

    expect(guard).toMatch(/v_profile\.role\s*=\s*'chef_cadastre'/i)
    expect(guard).toMatch(
      /p_new_status\s*=\s*'Validé techniquement'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'pv_mesurage_bornage'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'croquis'[\s\S]+RAISE EXCEPTION/i,
    )
    expect(guard).toMatch(/v_profile\.role\s*=\s*'conservateur'/i)
    expect(guard).toMatch(
      /p_new_status\s*=\s*'Valide'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'minute_certificat'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'bordereau_versement'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'attestation_paiement_banque'[\s\S]+NULLIF\s*\(\s*BTRIM\s*\(\s*p_notes\s*\)[\s\S]+RAISE EXCEPTION/i,
    )
    expect(guard.indexOf('UPDATE public.titres_fonciers')).toBeGreaterThan(
      guard.indexOf('Validation du Conservateur impossible'),
    )
  })

  it('reprend la version et l’attestation autoritaires pour les doublons', () => {
    expect(migration).toMatch(/FUNCTION\s+public\.record_smart_archive_duplicate/i)
    expect(migration).toMatch(/v_title\.document_version/i)
    expect(migration).toMatch(/v_attestation_text/i)
  })
})
