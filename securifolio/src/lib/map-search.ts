function cleanSegments(query: string): string[] {
  return query
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function normalizeSegment(segment: string): string {
  return segment
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/^(\d+[a-z/-]?\s+)(?:av(?:enue)?|rue|bd|boulevard)\.?\s+/i, '$1')
    .replace(/^(?:av(?:enue)?|rue|bd|boulevard)\.?\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildMapSearchCandidates(query: string): string[] {
  const originalSegments = cleanSegments(query)
  if (originalSegments.length === 0) return []

  const normalizedSegments = originalSegments
    .map(normalizeSegment)
    .filter(Boolean)
  const candidates = [originalSegments.join(', '), normalizedSegments.join(', ')]

  if (normalizedSegments.length >= 3) {
    candidates.push(`${normalizedSegments[0]}, ${normalizedSegments.at(-1)}`)
  }

  return Array.from(new Set(candidates.filter(Boolean)))
}
