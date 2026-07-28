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

  it('alloue atomiquement une nouvelle version de pièce côté serveur', () => {
    expect(migration).toMatch(/FUNCTION\s+public\.add_dossier_piece/i)
    expect(migration).toMatch(/pg_advisory_xact_lock/i)
    expect(migration).toMatch(/MAX\s*\(\s*version\s*\)[\s\S]+\+\s*1/i)
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.add_dossier_piece[\s\S]+FROM PUBLIC/i)
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.add_dossier_piece[\s\S]+TO authenticated/i)
  })

  it('bloque les approbations sans pièces ou justification de contrôle', () => {
    const guard = functionDefinition('update_title_status_with_history')

    expect(guard).toMatch(/v_profile\.role\s*=\s*'chef_cadastre'/i)
    expect(guard).toMatch(
      /p_new_status\s*=\s*'Validé techniquement'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'pv_mesurage_bornage'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'croquis'[\s\S]+RAISE EXCEPTION/i,
    )
    expect(guard).toMatch(/v_profile\.role\s*=\s*'conservateur'/i)
    expect(guard).toMatch(
      /p_new_status\s*=\s*'Valide'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'minute_certificat'[\s\S]+NOT EXISTS[\s\S]+type_piece\s*=\s*'preuve_paiement'[\s\S]+NULLIF\s*\(\s*BTRIM\s*\(\s*p_notes\s*\)[\s\S]+RAISE EXCEPTION/i,
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
