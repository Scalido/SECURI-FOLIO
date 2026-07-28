import { afterEach, describe, expect, it } from 'vitest'

import {
  buildIntegrityEnvelope,
  canonicalizeTitleMetadata,
  sha256,
  verifyIntegrityEnvelope,
} from '@/lib/documents/integrity'
import { withTemporaryAnalysisObject } from '@/lib/documents/temporary-analysis'

const metadata = {
  nom: 'Mosele Mombanga',
  numero_cadastral: '1178',
  volume: 'AMA 171',
  folio: '68',
  circonscription: 'Gombe',
  superficie: '450',
  date_etablissement: '2026-01-12T12:00:00.000Z',
}

describe('intégrité des documents', () => {
  afterEach(() => {
    delete process.env.CERTIFICATE_HMAC_SECRET
  })

  it('détecte la modification d’un octet du fichier original', () => {
    process.env.CERTIFICATE_HMAC_SECRET = 'test-integrity-secret'
    const original = new TextEncoder().encode('original-file-bytes')
    const changed = new TextEncoder().encode('original-file-byteS')
    const envelope = buildIntegrityEnvelope(sha256(original), metadata, 'agent-1')

    expect(verifyIntegrityEnvelope(envelope, original, metadata, 'agent-1')).toBe(true)
    expect(verifyIntegrityEnvelope(envelope, changed, metadata, 'agent-1')).toBe(false)
  })

  it('détecte la modification d’un champ de métadonnées', () => {
    process.env.CERTIFICATE_HMAC_SECRET = 'test-integrity-secret'
    const bytes = new TextEncoder().encode('original-file-bytes')
    const envelope = buildIntegrityEnvelope(sha256(bytes), metadata, 'agent-1')

    expect(
      verifyIntegrityEnvelope(
        envelope,
        bytes,
        { ...metadata, superficie: '451' },
        'agent-1',
      ),
    ).toBe(false)
  })

  it('canonise les métadonnées indépendamment de l’ordre des propriétés', () => {
    const reordered = {
      numero_cadastral: '1178',
      date_etablissement: '2026-01-12T12:00:00.000Z',
      superficie: '450',
      circonscription: 'Gombe',
      folio: '68',
      volume: 'AMA 171',
      nom: 'Mosele Mombanga',
    }

    expect(canonicalizeTitleMetadata(reordered)).toBe(
      canonicalizeTitleMetadata(metadata),
    )
  })

  it('échoue fermé lorsque le secret HMAC serveur manque', () => {
    expect(() =>
      buildIntegrityEnvelope(
        sha256(new TextEncoder().encode('bytes')),
        metadata,
        'agent-1',
      ),
    ).toThrow('CERTIFICATE_HMAC_SECRET')
  })
})

describe('nettoyage des objets temporaires d’analyse', () => {
  it('supprime l’objet temporaire après une analyse réussie', async () => {
    const events: string[] = []

    const result = await withTemporaryAnalysisObject({
      upload: async () => events.push('upload'),
      createSignedUrl: async () => {
        events.push('signed-url')
        return 'https://signed.invalid/temporary'
      },
      analyze: async (url) => {
        events.push(`analyze:${url}`)
        return 'ok'
      },
      cleanup: async () => events.push('cleanup'),
    })

    expect(result).toBe('ok')
    expect(events).toEqual([
      'upload',
      'signed-url',
      'analyze:https://signed.invalid/temporary',
      'cleanup',
    ])
  })

  it('supprime l’objet temporaire après une erreur d’analyse', async () => {
    const events: string[] = []

    await expect(
      withTemporaryAnalysisObject({
        upload: async () => events.push('upload'),
        createSignedUrl: async () => 'https://signed.invalid/temporary',
        analyze: async () => {
          events.push('analyze')
          throw new Error('analysis failed')
        },
        cleanup: async () => events.push('cleanup'),
      }),
    ).rejects.toThrow('analysis failed')

    expect(events).toEqual(['upload', 'analyze', 'cleanup'])
  })
})
