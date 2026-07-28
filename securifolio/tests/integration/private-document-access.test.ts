import { beforeEach, describe, expect, it, vi } from 'vitest'

const originalBytes = new TextEncoder().encode('original-file-bytes')

const state = vi.hoisted(() => ({
  queryField: '',
  profile: {
    full_name: 'Amina Kabasele',
    role: 'agent',
    matricule: 'MAT-2048',
    fonction: 'Inspectrice cadastrale',
    circonscription: 'Gombe',
  },
  title: null as null | Record<string, unknown>,
  history: {
    agent_id: 'agent-1',
  },
  downloadBytes: new TextEncoder().encode('original-file-bytes'),
  download: vi.fn(),
  createSignedUrl: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'agent-1' } } }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        const query = {
          select: () => query,
          eq: () => query,
          single: async () => ({ data: state.profile, error: null }),
        }
        return query
      }

      if (table === 'titres_fonciers') {
        const query = {
          select: () => query,
          eq: (field: string) => {
            state.queryField = field
            return query
          },
          single: async () =>
            state.queryField === 'id'
              ? { data: state.title, error: state.title ? null : { code: 'PGRST116' } }
              : { data: null, error: { code: 'PGRST116' } },
        }
        return query
      }

      if (table === 'smart_archive_history') {
        const query = {
          select: () => query,
          eq: () => query,
          single: async () => ({ data: state.history, error: null }),
        }
        return query
      }

      throw new Error(`Unexpected table: ${table}`)
    },
    storage: {
      from: (bucket: string) => {
        if (bucket !== 'scans_certificats') {
          throw new Error(`Unexpected bucket: ${bucket}`)
        }
        return {
          download: state.download,
          createSignedUrl: state.createSignedUrl,
          remove: state.remove,
        }
      },
    },
    rpc: state.rpc,
  }),
}))

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: state.rpc,
    storage: {
      from: (bucket: string) => {
        if (bucket !== 'scans_certificats') {
          throw new Error(`Unexpected bucket: ${bucket}`)
        }
        return {
          download: state.download,
          createSignedUrl: state.createSignedUrl,
          remove: state.remove,
        }
      },
    },
  }),
}))

import {
  getAdministrativeDocument,
  getTemporaryAnalysisUrl,
  saveCertificate,
} from '@/app/smart-archive/actions'

const certificate = {
  nom: 'Mosele Mombanga',
  numero_cadastral: '1178',
  volume: 'AMA 171',
  folio: '68',
  circonscription: 'Gombe',
  superficie: '450',
  date_etablissement: '12 janvier 2026',
  attested: true as const,
}

const storedTitle = {
  id: 'title-1',
  numero_cadastral: '1178',
  nom_proprietaire: 'Mosele Mombanga',
  volume: 'AMA 171',
  folio: '68',
  circonscription: 'Gombe',
  superficie: '450',
  date_enregistrement: '2026-01-12T12:00:00.000Z',
  storage_path: 'documents/agent-1/title-1.pdf',
  file_sha256: '012b3666e2248223852677115ce42337fcfcb1676285cdc333b66fbd2f224bed',
  metadata_hmac: 'fffe9676bd5eda5c8dad81fc5c5da70144bb6cfea031cba45991aa6f52cb41e3',
  document_version: 1,
}

describe('stockage documentaire privé', () => {
  beforeEach(() => {
    process.env.CERTIFICATE_HMAC_SECRET = 'test-integrity-secret'
    state.queryField = ''
    state.title = null
    state.downloadBytes = originalBytes
    state.download.mockReset()
    state.download.mockImplementation(async () => ({
      data: new Blob([state.downloadBytes]),
      error: null,
    }))
    state.createSignedUrl.mockReset()
    state.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.invalid/document' },
      error: null,
    })
    state.remove.mockReset()
    state.remove.mockResolvedValue({ error: null })
    state.rpc.mockReset()
    state.rpc.mockResolvedValue({ data: 'title-1', error: null })
  })

  it('calcule l’empreinte sur les octets stockés et transmet seulement le chemin privé', async () => {
    const result = await saveCertificate(
      certificate,
      'documents/agent-1/title-1.pdf',
    )

    expect(result).toEqual({ success: true })
    expect(state.rpc).toHaveBeenCalledWith(
      'create_title_with_history',
      expect.objectContaining({
        p_storage_path: 'documents/agent-1/title-1.pdf',
        p_file_sha256: '012b3666e2248223852677115ce42337fcfcb1676285cdc333b66fbd2f224bed',
        p_metadata_hmac: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    )
    const rpcPayload = state.rpc.mock.calls[0][1]
    expect(rpcPayload).not.toHaveProperty('p_scan_url')
    expect(rpcPayload).not.toHaveProperty('p_hash_signature')
  })

  it('refuse de signer un objet temporaire qui n’appartient pas à l’agent', async () => {
    const result = await getTemporaryAnalysisUrl(
      'temporary/another-agent/document.pdf',
    )

    expect(result).toEqual({
      data: null,
      error: 'Chemin de stockage non autorisé.',
    })
    expect(state.createSignedUrl).not.toHaveBeenCalled()
  })

  it('limite une URL temporaire autorisée à cinq minutes', async () => {
    const result = await getTemporaryAnalysisUrl(
      'temporary/agent-1/document.pdf',
    )

    expect(result).toEqual({
      data: { signedUrl: 'https://signed.invalid/document' },
      error: null,
    })
    expect(state.createSignedUrl).toHaveBeenCalledWith(
      'temporary/agent-1/document.pdf',
      300,
    )
  })
})

describe('consultation administrative avec contrôle d’intégrité', () => {
  beforeEach(() => {
    process.env.CERTIFICATE_HMAC_SECRET = 'test-integrity-secret'
    state.profile.role = 'conservateur'
    state.title = { ...storedTitle }
    state.history = { agent_id: 'agent-1' }
    state.downloadBytes = originalBytes
    state.download.mockReset()
    state.download.mockImplementation(async () => ({
      data: new Blob([state.downloadBytes]),
      error: null,
    }))
    state.createSignedUrl.mockReset()
    state.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.invalid/document' },
      error: null,
    })
    state.rpc.mockReset()
    state.rpc.mockResolvedValue({ data: true, error: null })
  })

  it('ne délivre l’URL signée qu’après vérification et journalise le succès', async () => {
    const result = await getAdministrativeDocument('title-1')

    expect(result).toEqual({
      success: true,
      integrity: 'passed',
      signedUrl: 'https://signed.invalid/document',
      expiresIn: 300,
    })
    expect(state.rpc).toHaveBeenCalledWith('log_document_integrity_check', {
      p_title_id: 'title-1',
      p_passed: true,
      p_actor_id: 'agent-1',
    })
    expect(state.createSignedUrl).toHaveBeenCalledWith(
      'documents/agent-1/title-1.pdf',
      300,
    )
  })

  it('bloque la consultation et journalise l’échec après altération du fichier', async () => {
    state.downloadBytes = new TextEncoder().encode('tampered-file-bytes')

    const result = await getAdministrativeDocument('title-1')

    expect(result).toEqual({
      success: false,
      integrity: 'failed',
      error: 'Contrôle d’intégrité échoué.',
    })
    expect(state.rpc).toHaveBeenCalledWith('log_document_integrity_check', {
      p_title_id: 'title-1',
      p_passed: false,
      p_actor_id: 'agent-1',
    })
    expect(state.createSignedUrl).not.toHaveBeenCalled()
  })
})
