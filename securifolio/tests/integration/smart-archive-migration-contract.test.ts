import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const migrationsDirectory = join(projectRoot, 'supabase', 'migrations')
const migrationSql = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(join(migrationsDirectory, name), 'utf8'))
  .join('\n')
const schemaSql = readFileSync(join(projectRoot, 'supabase', 'schema.sql'), 'utf8')

function latestFunctionDefinition(functionName: string) {
  const matcher = new RegExp(
    `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.${functionName}\\([\\s\\S]+?\\$\\$\\s+LANGUAGE`,
    'gi',
  )
  let latestDefinition = ''
  let match = matcher.exec(migrationSql)
  while (match) {
    latestDefinition = match[0]
    match = matcher.exec(migrationSql)
  }
  return latestDefinition
}

describe('contrat SQL Smart-Archive', () => {
  it('convertit toute ancienne version texte vers INTEGER NOT NULL avec validation', () => {
    expect(migrationSql).toMatch(
      /ALTER\s+COLUMN\s+document_version\s+TYPE\s+INTEGER\s+USING/i,
    )
    expect(migrationSql).toMatch(
      /ALTER\s+COLUMN\s+document_version\s+SET\s+NOT\s+NULL/i,
    )
    expect(migrationSql).toMatch(
      /document_version[^\n]+!~[^\n]+'\^\[0-9\]\+\$'/i,
    )
    expect(schemaSql).toMatch(/document_version\s+INTEGER\s+NOT\s+NULL/i)
  })

  it('interdit les écritures directes et conserve la lecture authentifiée', () => {
    expect(migrationSql).toMatch(
      /DROP\s+POLICY\s+IF\s+EXISTS\s+"Agents peuvent insérer historique"\s+ON\s+public\.smart_archive_history/i,
    )
    expect(migrationSql).toMatch(
      /REVOKE\s+INSERT\s*,\s*UPDATE\s*,\s*DELETE\s+ON\s+TABLE\s+public\.smart_archive_history\s+FROM\s+authenticated/i,
    )
    expect(migrationSql).toMatch(
      /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.smart_archive_history\s+TO\s+authenticated/i,
    )
    expect(schemaSql).not.toMatch(
      /CREATE\s+POLICY\s+"Agents peuvent insérer historique"/i,
    )
  })

  it('réserve la RPC attestée aux utilisateurs authentifiés et fixe son contexte', () => {
    expect(migrationSql).toMatch(
      /ALTER\s+FUNCTION\s+public\.create_title_with_history\([\s\S]+?\)\s+SECURITY\s+DEFINER/i,
    )
    expect(migrationSql).toMatch(
      /ALTER\s+FUNCTION\s+public\.create_title_with_history\([\s\S]+?\)\s+SET\s+search_path\s*=\s*public/i,
    )
    expect(migrationSql).toMatch(
      /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.create_title_with_history\([\s\S]+?\)\s+FROM\s+PUBLIC/i,
    )
    expect(migrationSql).toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.create_title_with_history\([\s\S]+?\)\s+TO\s+authenticated/i,
    )
  })

  it('calcule les versions uniquement depuis les créations autoritatives', () => {
    const createTitle = latestFunctionDefinition('create_title_with_history')
    const allocator = latestFunctionDefinition('assign_smart_archive_document_version')

    expect(createTitle).toMatch(
      /MAX\(document_version\)[\s\S]+?action_type\s*=\s*'insert'/i,
    )
    expect(allocator).toMatch(
      /MAX\(document_version\)[\s\S]+?action_type\s*=\s*'insert'/i,
    )
  })

  it('verrouille et valide le vrai doublon avant de journaliser', () => {
    const duplicate = latestFunctionDefinition('record_smart_archive_duplicate')
    const lockPosition = duplicate.search(/pg_advisory_xact_lock/i)
    const titleCheckPosition = duplicate.search(/FROM\s+public\.titres_fonciers/i)
    const insertPosition = duplicate.search(/INSERT\s+INTO\s+public\.smart_archive_history/i)

    expect(lockPosition).toBeGreaterThanOrEqual(0)
    expect(titleCheckPosition).toBeGreaterThan(lockPosition)
    expect(insertPosition).toBeGreaterThan(titleCheckPosition)
    expect(duplicate).toMatch(/action_type\s*=\s*'insert'/i)
    expect(duplicate).toMatch(/attestation_text\s+IS\s+NOT\s+NULL/i)
    expect(duplicate).toMatch(/RAISE\s+EXCEPTION/i)
  })
})
