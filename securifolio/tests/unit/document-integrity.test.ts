import { afterEach, describe, expect, it } from 'vitest'

import {
  buildIntegrityEnvelope,
  canonicalizeTitleMetadata,
  sha256,
  verifyIntegrityEnvelope,
} from '@/lib/documents/integrity'
import {
  withDefinitiveObjectRetention,
  withDefinitiveUploadObject,
  withTemporaryAnalysisObject,
} from '@/lib/documents/temporary-analysis'

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

  it('tente le nettoyage même si l’upload temporaire échoue', async () => {
    const events: string[] = []

    await expect(
      withTemporaryAnalysisObject({
        upload: async () => {
          events.push('upload')
          throw new Error('partial upload failed')
        },
        createSignedUrl: async () => {
          throw new Error('must not run')
        },
        analyze: async () => {
          throw new Error('must not run')
        },
        cleanup: async () => events.push('cleanup'),
      }),
    ).rejects.toThrow('partial upload failed')

    expect(events).toEqual(['upload', 'cleanup'])
  })

  it('remonte l’échec primaire et l’échec de nettoyage temporaire', async () => {
    await expect(
      withTemporaryAnalysisObject({
        upload: async () => {
          throw new Error('upload partial failed')
        },
        createSignedUrl: async () => 'unused',
        analyze: async () => 'unused',
        cleanup: async () => {
          throw new Error('cleanup denied')
        },
      }),
    ).rejects.toThrow('upload partial failed Nettoyage du fichier impossible : cleanup denied')
  })
})

describe('cycle de vie des objets définitifs', () => {
  it('tente le nettoyage si l’upload définitif échoue', async () => {
    const events: string[] = []

    await expect(
      withDefinitiveUploadObject({
        upload: async () => {
          events.push('upload')
          throw new Error('partial upload failed')
        },
        operation: async () => ({ success: true as const }),
        cleanup: async () => events.push('cleanup'),
      }),
    ).rejects.toThrow('partial upload failed')

    expect(events).toEqual(['upload', 'cleanup'])
  })

  it('supprime après un rejet en aval de l’upload définitif', async () => {
    const events: string[] = []

    const result = await withDefinitiveUploadObject({
      upload: async () => events.push('upload'),
      operation: async () => ({ success: false as const, error: 'rejected' }),
      cleanup: async () => events.push('cleanup'),
    })

    expect(result).toEqual({ success: false, error: 'rejected' })
    expect(events).toEqual(['upload', 'cleanup'])
  })

  it('conserve après upload et rattachement définitif réussis', async () => {
    const events: string[] = []

    const result = await withDefinitiveUploadObject({
      upload: async () => events.push('upload'),
      operation: async () => ({ success: true as const }),
      cleanup: async () => events.push('cleanup'),
    })

    expect(result).toEqual({ success: true })
    expect(events).toEqual(['upload'])
  })

  it('conserve uniquement l’objet rattaché par une opération réussie', async () => {
    const cleanupEvents: string[] = []

    const result = await withDefinitiveObjectRetention({
      operation: async () => ({ success: true as const }),
      cleanup: async () => cleanupEvents.push('cleanup'),
    })

    expect(result).toEqual({ success: true })
    expect(cleanupEvents).toEqual([])
  })

  it('supprime l’objet après un résultat métier en échec', async () => {
    const cleanupEvents: string[] = []

    const result = await withDefinitiveObjectRetention({
      operation: async () => ({ success: false as const, error: 'invalid' }),
      cleanup: async () => cleanupEvents.push('cleanup'),
    })

    expect(result).toEqual({ success: false, error: 'invalid' })
    expect(cleanupEvents).toEqual(['cleanup'])
  })

  it('supprime l’objet après une exception en aval', async () => {
    const cleanupEvents: string[] = []

    await expect(
      withDefinitiveObjectRetention({
        operation: async () => {
          throw new Error('rpc unavailable')
        },
        cleanup: async () => cleanupEvents.push('cleanup'),
      }),
    ).rejects.toThrow('rpc unavailable')

    expect(cleanupEvents).toEqual(['cleanup'])
  })

  it('conserve l’erreur métier et signale un nettoyage définitif impossible', async () => {
    const result = await withDefinitiveObjectRetention({
      operation: async () => ({ success: false as const, error: 'invalid' }),
      cleanup: async () => {
        throw new Error('storage remove denied')
      },
    })

    expect(result).toEqual({
      success: false,
      error: 'invalid Nettoyage du fichier impossible : storage remove denied',
    })
  })

  it('conserve les deux causes lorsque opération et nettoyage lèvent', async () => {
    await expect(
      withDefinitiveObjectRetention({
        operation: async () => {
          throw new Error('rpc unavailable')
        },
        cleanup: async () => {
          throw new Error('storage remove denied')
        },
      }),
    ).rejects.toThrow(
      'rpc unavailable Nettoyage du fichier impossible : storage remove denied',
    )
  })
})
