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

describe('contrat SQL des dossiers fonciers', () => {
  it('crée les dossiers, les pièces immuables et le lien du titre', () => {
    expect(migration).toMatch(/CREATE TABLE[\s\S]+dossiers_fonciers/i)
    expect(migration).toMatch(/CREATE TABLE[\s\S]+pieces_dossier/i)
    expect(migration).toMatch(/dossier_id\s+UUID[\s\S]+REFERENCES\s+public\.dossiers_fonciers/i)
    expect(migration).toMatch(/UNIQUE\s*\(\s*dossier_id\s*,\s*type_piece\s*,\s*version\s*\)/i)
    expect(migration).toMatch(/ALTER TABLE\s+public\.titres_fonciers[\s\S]+dossier_id/i)
    expect(migration).not.toMatch(/UPDATE\s+public\.pieces_dossier/i)
  })

  it('alloue atomiquement une nouvelle version de pièce côté serveur', () => {
    expect(migration).toMatch(/FUNCTION\s+public\.add_dossier_piece/i)
    expect(migration).toMatch(/pg_advisory_xact_lock/i)
    expect(migration).toMatch(/MAX\s*\(\s*version\s*\)[\s\S]+\+\s*1/i)
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.add_dossier_piece[\s\S]+FROM PUBLIC/i)
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.add_dossier_piece[\s\S]+TO authenticated/i)
  })

  it('bloque les approbations sans pièces ou justification de contrôle', () => {
    expect(migration).toMatch(/v_profile\.role\s*=\s*'chef_cadastre'/i)
    expect(migration).toMatch(/'pv_mesurage_bornage'/i)
    expect(migration).toMatch(/'croquis'/i)
    expect(migration).toMatch(/v_profile\.role\s*=\s*'conservateur'/i)
    expect(migration).toMatch(/'minute_certificat'/i)
    expect(migration).toMatch(/'preuve_paiement'/i)
    expect(migration).toMatch(/NULLIF\s*\(\s*BTRIM\s*\(\s*p_notes\s*\)/i)
  })

  it('reprend la version et l’attestation autoritaires pour les doublons', () => {
    expect(migration).toMatch(/FUNCTION\s+public\.record_smart_archive_duplicate/i)
    expect(migration).toMatch(/v_title\.document_version/i)
    expect(migration).toMatch(/v_attestation_text/i)
  })
})
