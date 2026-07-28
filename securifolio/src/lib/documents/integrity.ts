import crypto from 'node:crypto'

import type { CertificateData } from '@/lib/validations'

export type IntegrityEnvelope = {
  fileSha256: string
  metadataHmac: string
}

export type IntegritySchemaVersion = 1 | 2

function requireIntegritySecret() {
  const secret = process.env.CERTIFICATE_HMAC_SECRET

  if (!secret) {
    throw new Error('CERTIFICATE_HMAC_SECRET is required for document integrity')
  }

  return secret
}

export function sha256(bytes: Uint8Array): string {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

export function canonicalizeTitleMetadata(
  input: CertificateData,
  schemaVersion: IntegritySchemaVersion,
): string {
  const legacyMetadata = {
    circonscription: input.circonscription?.trim() || '',
    date_etablissement: input.date_etablissement?.trim() || '',
    folio: input.folio?.trim() || '',
    nom: input.nom.trim(),
    numero_cadastral: input.numero_cadastral.trim(),
    superficie: input.superficie?.trim() || '',
    volume: input.volume?.trim() || '',
  }

  if (schemaVersion === 1) {
    return JSON.stringify(legacyMetadata)
  }

  return JSON.stringify({
    ...legacyMetadata,
    charges_reelles: input.charges_reelles?.trim() || '',
    date_sceau: input.date_sceau?.trim() || '',
    description_immeuble: input.description_immeuble?.trim() || '',
    droits_constates: input.droits_constates?.trim() || '',
    signataire_conservateur:
      input.signataire_conservateur?.trim() || '',
    situation: input.situation?.trim() || '',
  })
}

function metadataHmac(
  fileHash: string,
  metadata: CertificateData,
  actorId: string,
  schemaVersion: IntegritySchemaVersion,
): string {
  const payload = schemaVersion === 1
    ? JSON.stringify({
        actorId,
        fileSha256: fileHash,
        metadata: canonicalizeTitleMetadata(metadata, 1),
      })
    : JSON.stringify({
        actorId,
        fileSha256: fileHash,
        integritySchemaVersion: 2,
        metadata: canonicalizeTitleMetadata(metadata, 2),
      })

  return crypto
    .createHmac('sha256', requireIntegritySecret())
    .update(payload)
    .digest('hex')
}

export function buildIntegrityEnvelope(
  fileHash: string,
  metadata: CertificateData,
  actorId: string,
  schemaVersion: IntegritySchemaVersion,
): IntegrityEnvelope {
  return {
    fileSha256: fileHash,
    metadataHmac: metadataHmac(fileHash, metadata, actorId, schemaVersion),
  }
}

export function verifyIntegrityEnvelope(
  envelope: IntegrityEnvelope,
  bytes: Uint8Array,
  metadata: CertificateData,
  actorId: string,
  schemaVersion: IntegritySchemaVersion,
): boolean {
  const actualFileHash = sha256(bytes)
  const actualMetadataHmac = metadataHmac(
    envelope.fileSha256,
    metadata,
    actorId,
    schemaVersion,
  )

  const expected = Buffer.from(envelope.metadataHmac, 'hex')
  const actual = Buffer.from(actualMetadataHmac, 'hex')
  const hmacMatches =
    expected.length === actual.length && crypto.timingSafeEqual(expected, actual)

  return actualFileHash === envelope.fileSha256 && hmacMatches
}
