import { describe, expect, it } from 'vitest'

import {
  canRecordDuplicate,
  nextAuthoritativeDocumentVersion,
} from '@/lib/smart-archive/versioning'

describe('version documentaire Smart-Archive', () => {
  it('ignore les événements doublons lors du calcul de la prochaine version', () => {
    expect(nextAuthoritativeDocumentVersion([
      { actionType: 'insert', documentVersion: 1 },
      { actionType: 'rejected_duplicate', documentVersion: 1 },
      { actionType: 'approved_by_cadastre', documentVersion: 1 },
    ])).toBe(2)
  })

  it('retourne 1 si aucun save autoritatif ne précède', () => {
    expect(nextAuthoritativeDocumentVersion([
      { actionType: 'rejected_duplicate', documentVersion: 99 },
    ])).toBe(1)
  })

  it('n’autorise un audit doublon qu’avec titre et création attestée existants', () => {
    expect(canRecordDuplicate({
      hasStoredTitle: true,
      hasAttestedCreationHistory: true,
    })).toBe(true)
    expect(canRecordDuplicate({
      hasStoredTitle: false,
      hasAttestedCreationHistory: true,
    })).toBe(false)
    expect(canRecordDuplicate({
      hasStoredTitle: true,
      hasAttestedCreationHistory: false,
    })).toBe(false)
  })
})
