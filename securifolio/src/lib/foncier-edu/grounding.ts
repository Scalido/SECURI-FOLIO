import { z } from 'zod'

export type SourceVerification = 'official' | 'secondary' | 'unverified'
export type SourceKind = 'law' | 'regulation' | 'guide' | 'working_summary'

export interface KnowledgeDocument {
  id: string
  title: string
  authority: string
  kind: SourceKind
  provenance: string
  verification: SourceVerification
  content: string
}

const SOURCE_CATALOG: Record<string, Omit<KnowledgeDocument, 'content'>> = {
  'guide_pratique_concession_fonciere.md': {
    id: 'guide-pratique-concession',
    title: 'Guide pratique d’acquisition d’une concession foncière en RDC',
    authority: 'Ministère des Affaires foncières — Secrétariat général',
    kind: 'guide',
    provenance: 'Guide ministériel validé à Goma les 16 et 17 mai 2019',
    verification: 'official',
  },
  'loi_25_062.md': {
    id: 'loi-fonciere-73-021-modifiee',
    title: 'Loi n° 73-021 du 20 juillet 1973, modifiée et complétée',
    authority: 'République démocratique du Congo',
    kind: 'law',
    provenance: 'Copie secondaire identifiée : Leganews Pro',
    verification: 'secondary',
  },
  'arrete_cadastre_90_0012.md': {
    id: 'resume-arrete-cadastre-90-0012',
    title: 'Résumé de travail — arrêté cadastral n° 90-0012',
    authority: 'Autorité et copie officielle non documentées',
    kind: 'working_summary',
    provenance: 'Résumé local sans articles ni copie officielle vérifiée',
    verification: 'unverified',
  },
  'arrete_tarifs_0075_2023.md': {
    id: 'resume-arrete-tarifs-0075-2023',
    title: 'Résumé de travail — arrêté tarifaire n° 0075/2023',
    authority: 'Autorité et copie officielle non documentées',
    kind: 'working_summary',
    provenance: 'Résumé local sans articles ni copie officielle vérifiée',
    verification: 'unverified',
  },
  'loi_baux_a_loyer_2015.md': {
    id: 'resume-loi-baux-15-025',
    title: 'Résumé de travail — loi n° 15/025 relative aux baux à loyer',
    authority: 'Autorité et copie officielle non documentées',
    kind: 'working_summary',
    provenance: 'Résumé local sans articles ni copie officielle vérifiée',
    verification: 'unverified',
  },
  'ordonnance_74_148_execution.md': {
    id: 'resume-ordonnance-74-148',
    title: 'Résumé de travail — ordonnance n° 74/148',
    authority: 'Autorité et copie officielle non documentées',
    kind: 'working_summary',
    provenance: 'Résumé local sans articles ni copie officielle vérifiée',
    verification: 'unverified',
  },
}

export function createKnowledgeDocuments(
  contentsByFilename: Record<string, string>,
): KnowledgeDocument[] {
  return Object.entries(contentsByFilename).flatMap(([filename, content]) => {
    const metadata = SOURCE_CATALOG[filename]
    return metadata ? [{ ...metadata, content }] : []
  })
}

export interface KnowledgeChunk extends Omit<KnowledgeDocument, 'content' | 'id'> {
  sourceId: string
  chunkId: string
  section: string
  content: string
}

export interface GroundedCitation {
  sourceId: string
  section: string
  excerpt: string
}

export interface GroundedAnswer {
  answer: string
  coverage: 'covered' | 'partial' | 'not_covered'
  sources: GroundedCitation[]
}

export interface VerifiedCitation extends GroundedCitation {
  title: string
  authority: string
  kind: SourceKind
  provenance: string
  verification: SourceVerification
}

export interface VerifiedGroundedAnswer extends Omit<GroundedAnswer, 'sources'> {
  sources: VerifiedCitation[]
}

const STOP_WORDS = new Set([
  'alors', 'avec', 'avoir', 'cette', 'dans', 'document', 'elle', 'elles',
  'entre', 'est', 'etre', 'fait', 'faire', 'les', 'leur', 'leurs', 'mais',
  'mon', 'nous', 'par', 'pas', 'pour', 'quel', 'quelle', 'quels', 'qui',
  'sans', 'ses', 'son', 'sont', 'sur', 'une', 'vous', 'votre',
])

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens(value: string): string[] {
  return Array.from(new Set(
    normalizeText(value)
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  ))
}

function splitDocument(document: KnowledgeDocument): KnowledgeChunk[] {
  const normalizedContent = document.kind === 'law'
    ? document.content.replace(
        /(Article\.\s*\d+[A-Za-z-]*\.?)/g,
        '\n## $1\n',
      )
    : document.content
  const lines = normalizedContent.split(/\r?\n/)
  const chunks: KnowledgeChunk[] = []
  let section = document.title
  let buffer: string[] = []

  const flush = () => {
    const content = buffer.join('\n').trim()
    if (!content) return

    chunks.push({
      title: document.title,
      authority: document.authority,
      kind: document.kind,
      provenance: document.provenance,
      verification: document.verification,
      sourceId: document.id,
      content,
      section,
      chunkId: `${document.id}:${chunks.length + 1}`,
    })
    buffer = []
  }

  for (const line of lines) {
    const heading = line.match(/^#{1,4}\s+(.+)$/)
    if (heading) {
      flush()
      section = heading[1].trim()
      continue
    }

    buffer.push(line)
    if (buffer.join('\n').length >= 1_800) flush()
  }
  flush()

  return chunks
}

export function buildKnowledgeIndex(documents: KnowledgeDocument[]): KnowledgeChunk[] {
  return documents.flatMap(splitDocument)
}

export function retrieveKnowledge(
  query: string,
  index: KnowledgeChunk[],
  limit = 6,
): KnowledgeChunk[] {
  const queryTokens = tokens(query)
  if (queryTokens.length === 0) return []

  const ranked = index
    .map((chunk) => {
      const searchable = normalizeText([
        chunk.title,
        chunk.section,
        chunk.content,
      ].join(' '))
      const score = queryTokens.reduce((total, token) => {
        const matches = searchable.match(new RegExp(`\\b${token}`, 'g'))?.length ?? 0
        return total + Math.min(matches, 4)
      }, 0)
      return { chunk, score }
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)

  const selected: KnowledgeChunk[] = []
  const add = (chunk: KnowledgeChunk | undefined) => {
    if (
      chunk
      && selected.length < limit
      && !selected.some((candidate) => candidate.chunkId === chunk.chunkId)
    ) {
      selected.push(chunk)
    }
  }

  const seeds = ranked.slice(0, Math.max(1, Math.ceil(limit / 2)))
  for (const { chunk } of seeds) {
    add(chunk)
    const position = index.findIndex((candidate) => candidate.chunkId === chunk.chunkId)
    const previous = index[position - 1]
    const next = index[position + 1]
    if (previous?.sourceId === chunk.sourceId) add(previous)
    if (next?.sourceId === chunk.sourceId) add(next)
  }

  for (const { chunk } of ranked) add(chunk)
  return selected
}

const groundedAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(16_000),
  coverage: z.enum(['covered', 'partial', 'not_covered']),
  sources: z.array(z.object({
    sourceId: z.string().trim().min(1).max(200),
    section: z.string().trim().min(1).max(500),
    excerpt: z.string().trim().min(1).max(8_000),
  })).max(20),
})

export function validateGroundedAnswer(
  answer: unknown,
  chunks: KnowledgeChunk[],
):
  | { ok: true; value: VerifiedGroundedAnswer }
  | { ok: false; error: string } {
  const parsed = groundedAnswerSchema.safeParse(answer)
  if (!parsed.success) {
    return { ok: false, error: 'Réponse structurée invalide.' }
  }

  if (parsed.data.coverage !== 'not_covered' && parsed.data.sources.length === 0) {
    return { ok: false, error: 'Réponse juridique sans citation.' }
  }

  const sources: VerifiedCitation[] = []
  let rejectedCitationCount = 0
  for (const citation of parsed.data.sources) {
    const candidates = chunks
      .filter((candidate) => candidate.sourceId === citation.sourceId)
      .sort((left, right) => {
        const leftMatches = normalizeText(left.section) === normalizeText(citation.section)
        const rightMatches = normalizeText(right.section) === normalizeText(citation.section)
        return Number(rightMatches) - Number(leftMatches)
      })
    const match = candidates
      .map((chunk) => ({
        chunk,
        excerpt: resolveSourceExcerpt(chunk.content, citation.excerpt),
      }))
      .find(({ excerpt }) => Boolean(excerpt))

    if (!match?.excerpt) {
      rejectedCitationCount += 1
      continue
    }

    sources.push({
      ...citation,
      section: match.chunk.section,
      excerpt: match.excerpt.slice(0, 320),
      title: match.chunk.title,
      authority: match.chunk.authority,
      kind: match.chunk.kind,
      provenance: match.chunk.provenance,
      verification: match.chunk.verification,
    })
  }

  const uniqueSources = sources.filter((source, index, allSources) => (
    allSources.findIndex((candidate) => (
      candidate.sourceId === source.sourceId
      && candidate.section === source.section
      && candidate.excerpt === source.excerpt
    )) === index
  ))

  if (parsed.data.coverage !== 'not_covered' && uniqueSources.length === 0) {
    return { ok: false, error: 'Aucune citation ne correspond aux passages transmis.' }
  }

  if (
    parsed.data.coverage === 'covered'
    && uniqueSources.length > 0
    && uniqueSources.every((source) => source.verification === 'unverified')
  ) {
    return {
      ok: false,
      error: 'Une source non vérifiée ne peut pas suffire comme fondement juridique.',
    }
  }

  return {
    ok: true,
    value: {
      answer: parsed.data.answer,
      coverage: parsed.data.coverage === 'covered' && rejectedCitationCount > 0
        ? 'partial'
        : parsed.data.coverage,
      sources: uniqueSources,
    },
  }
}

function resolveSourceExcerpt(sourceContent: string, proposedExcerpt: string): string | null {
  if (sourceContent.includes(proposedExcerpt)) {
    if (proposedExcerpt.length >= 80 && tokens(proposedExcerpt).length >= 6) {
      return proposedExcerpt
    }

    const containingSentence = (sourceContent.match(/[^.!?\n]+[.!?]?/g) ?? [])
      .map((sentence) => sentence.trim())
      .find((sentence) => (
        sentence.includes(proposedExcerpt)
        && sentence.length >= 60
      ))
    if (containingSentence) return containingSentence

    const index = sourceContent.indexOf(proposedExcerpt)
    const start = Math.max(0, index - 120)
    const end = Math.min(sourceContent.length, index + proposedExcerpt.length + 180)
    return sourceContent.slice(start, end).trim()
  }

  const proposedTokens = tokens(proposedExcerpt)
  if (proposedTokens.length < 3) return null

  const sentences = sourceContent.match(/[^.!?\n]+[.!?]?/g) ?? []
  let bestSentence = ''
  let bestScore = 0

  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim()
    const sentenceTokens = tokens(sentence)
    const shared = proposedTokens.filter((token) => sentenceTokens.includes(token)).length
    const score = shared / Math.min(proposedTokens.length, Math.max(sentenceTokens.length, 1))

    if (shared >= 4 && score > bestScore) {
      bestSentence = sentence
      bestScore = score
    }
  }

  return bestScore >= 0.6 ? bestSentence : null
}

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2_000),
  })).min(1).max(20),
})

export function parseChatRequest(input: unknown) {
  const parsed = chatRequestSchema.safeParse(input)
  if (!parsed.success) return parsed
  if (parsed.data.messages.at(-1)?.role !== 'user') {
    return {
      success: false as const,
      error: {
        issues: [{ message: 'Le dernier message doit provenir de l’utilisateur.' }],
      },
    }
  }
  return parsed
}

const CHAT_ACCESS_POLICIES = {
  public: {
    keyPrefix: 'public',
    limit: 3,
    windowMs: 3_600_000,
    label: '3 questions par heure',
  },
  authenticated: {
    keyPrefix: 'authenticated',
    limit: 12,
    windowMs: 60_000,
    label: '12 questions par minute',
  },
  agent: {
    keyPrefix: 'agent',
    limit: 30,
    windowMs: 60_000,
    label: '30 questions par minute',
  },
} as const

export function selectChatAccessPolicy(access: keyof typeof CHAT_ACCESS_POLICIES) {
  return CHAT_ACCESS_POLICIES[access]
}
