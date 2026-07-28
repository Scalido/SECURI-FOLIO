export type SmartArchiveVersionEvent = {
  actionType: string
  documentVersion: number
}

export function nextAuthoritativeDocumentVersion(
  events: SmartArchiveVersionEvent[],
) {
  const authoritativeVersions = events
    .filter((event) => event.actionType === 'insert')
    .map((event) => event.documentVersion)

  return Math.max(0, ...authoritativeVersions) + 1
}

export function canRecordDuplicate({
  hasStoredTitle,
  hasAttestedCreationHistory,
}: {
  hasStoredTitle: boolean
  hasAttestedCreationHistory: boolean
}) {
  return hasStoredTitle && hasAttestedCreationHistory
}
